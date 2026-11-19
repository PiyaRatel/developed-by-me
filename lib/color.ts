// Colour maths for the token guard (stop 01). Pure functions, unit-tested.

export type HSL = { h: number; s: number; l: number };

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

export function hslToHex({ h, s, l }: HSL): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

export function hexToHsl(hex: string): HSL {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.2 AA for normal text. */
export const AA = 4.5;

/**
 * Token guard: keep hue and saturation (the brand "decision"), move lightness the
 * smallest distance that passes AA against `on`. Returns the input when it already passes.
 */
export function nearestAccessible(hex: string, on: string, target = AA): string {
  if (contrast(hex, on) >= target) return hex;
  const base = hexToHsl(hex);
  for (let step = 1; step <= 100; step++) {
    for (const dir of [-1, 1]) {
      const l = base.l + dir * step;
      if (l < 0 || l > 100) continue;
      const candidate = hslToHex({ ...base, l });
      if (contrast(candidate, on) >= target) return candidate;
    }
  }
  return on === "#ffffff" ? "#000000" : "#ffffff";
}

/** WCAG 2.2 AAA for normal text. High contrast mode aims for this. */
export const AAA = 7;

/** The three theme values derived from one brand decision. Dark is re-tuned, not inverted. */
export function brandScale(brand: string) {
  const hsl = hexToHsl(brand);
  const light = nearestAccessible(brand, "#ffffff");
  const darkSeed = hslToHex({ h: hsl.h, s: Math.min(hsl.s, 85), l: Math.max(hsl.l, 72) });
  const dark = nearestAccessible(darkSeed, "#0e0d0b");
  // High contrast keeps the brand hue but pushes it vivid and bright enough for AAA on pure black.
  const hcSeed = hslToHex({ h: hsl.h, s: Math.min(100, Math.max(hsl.s, 70)), l: Math.max(hsl.l, 75) });
  const hc = nearestAccessible(hcSeed, "#000000", AAA);
  return { light, dark, hc };
}
