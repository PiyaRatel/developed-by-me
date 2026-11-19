// Design-system tools shared by the MCP server (mcp-server/index.mjs) and stop 09.
// Plain ESM so both Node and the Next.js bundle can import it.
import registry from "./registry.json" with { type: "json" };

const TOKEN_VALUES = {
  "space-3": "12px", "space-4": "16px", "space-5": "24px", "radius-l": "20px",
  "color-surface-2": "#ecebe5", "color-text": "#171612", "color-text-muted": "#55534b",
  "button-bg": "var(--color-action)", "button-fg": "#ffffff", "button-radius": "999px",
};

const SYNONYMS = { empty: ["EmptyState"], blank: ["EmptyState"], nothing: ["EmptyState"], canceled: ["Badge", "EmptyState"], cancelled: ["Badge", "EmptyState"], subscription: ["Badge", "Button"], status: ["Badge"], action: ["Button"], button: ["Button"], cta: ["Button"], text: ["Text"], layout: ["Stack"] };

export function search_components({ query }) {
  const words = String(query).toLowerCase().split(/\W+/).filter(Boolean);
  const names = new Set();
  for (const w of words) {
    for (const n of SYNONYMS[w] ?? []) names.add(n);
    for (const c of registry.components) if (c.name.toLowerCase() === w || c.description.toLowerCase().split(/\W+/).includes(w) && w.length > 4) names.add(c.name);
  }
  return registry.components.filter((c) => names.has(c.name)).map(({ name, description }) => ({ name, description }));
}

export function get_tokens({ component }) {
  const c = registry.components.find((x) => x.name === component);
  return c ? c.tokens.map((t) => ({ token: t, value: TOKEN_VALUES[t] ?? "themed" })) : [];
}

export function get_usage_rules() {
  return registry.usageRules;
}

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
}

export function check_contrast({ fg, bg }) {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  const ratio = Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
  return { ratio, passesAA: ratio >= 4.5 };
}

export const registryData = registry;
