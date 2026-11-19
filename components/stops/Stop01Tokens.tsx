"use client";

import { useState } from "react";
import { AA, brandScale, contrast, hexToHsl, hslToHex, nearestAccessible } from "@/lib/color";
import { useStore, type Theme } from "@/lib/store";
import { useStop } from "../Stop";

const THEMES: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "hc", label: "High contrast" },
];

const SYNC = ["Figma variable changed", "PR opened on GitHub", "Tokens built", "Deployed"];

export default function Stop01Tokens() {
  const { brand, setBrand, theme, setTheme } = useStore();
  const { complete, done } = useStop();
  const start = hexToHsl(brand);
  const [hue, setHue] = useState(start.h);
  const [light, setLight] = useState(start.l);
  const [message, setMessage] = useState<string | null>(null);
  const [sync, setSync] = useState(-1);
  const [snapped, setSnapped] = useState<string | null>(null);

  // After a snap, show the exact guarded hex (HSL rounding could drift it back under 4.5).
  const draft = snapped ?? hslToHex({ h: hue, s: Math.max(start.s, 60), l: light });
  const ratio = contrast(draft, "#ffffff");
  const passes = ratio >= AA;
  const current = brandScale(brand);
  // The ticket shows the draft as the active theme renders it: raw in light (so the dare can
  // fail visibly), re-tuned for dark surfaces in dark, and pushed to AAA on black in high contrast.
  const shown = theme === "light" ? draft : brandScale(draft)[theme];

  const save = () => {
    if (passes) {
      setBrand(draft);
      setMessage(`Saved ${draft}. It passes, so every stop now uses it. For the dare, push lightness up until it fails, then save.`);
      return;
    }
    const fixed = nearestAccessible(draft, "#ffffff");
    setLight(hexToHsl(fixed).l);
    setSnapped(fixed);
    setBrand(fixed);
    setMessage(`Guard: ${draft} fails AA (${ratio.toFixed(1)}:1). Snapped to ${fixed} (${contrast(fixed, "#ffffff").toFixed(1)}:1), the nearest passing lightness.`);
    complete();
  };

  const runSync = () => {
    setSync(0);
    SYNC.forEach((_, i) => window.setTimeout(() => setSync(i + 1), (i + 1) * 500));
  };

  return (
    <div className="s01">
      <div className="s01-preview">
        <article className="demo-card" style={{ ["--demo-brand" as string]: shown }}>
          <div className="demo-card-band">
            <p className="demo-card-kicker">New</p>
            <p className="demo-card-title">Spring design review</p>
          </div>
          <div className="demo-card-body">
            <p>Thursday · 30 min · 6 people</p>
            <span className="demo-btn">Join call</span>
          </div>
        </article>
        <p className={`contrast ${passes ? "is-ok" : "is-bad"}`} aria-live="polite">
          <span aria-hidden="true">{passes ? "✓" : "✕"}</span> Brand on white {ratio.toFixed(1)}:1 · {passes ? "Passes AA" : "Fails AA (needs 4.5)"}
        </p>
      </div>

      <div className="s01-controls">
        <label className="field">
          <span>Brand hue</span>
          <input type="range" min={0} max={359} value={hue} onChange={(e) => {
              setSnapped(null);
              setHue(Number(e.target.value));
            }} />
        </label>
        <label className="field">
          <span>Brand lightness · {light}%</span>
          <input type="range" min={10} max={95} value={light} onChange={(e) => {
              setSnapped(null);
              setLight(Number(e.target.value));
            }} />
        </label>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save brand colour
        </button>
        {message && (
          <p className="guard-msg" role="status">
            {message}
          </p>
        )}
        {done && !message && <p className="guard-msg">Your colour is now styling every stop.</p>}
      </div>

      <div className="s01-tiers">
        <table className="token-table">
          <caption className="sr-only">Token tiers</caption>
          <tbody>
            <tr>
              <th scope="row">primitive</th>
              <td>
                <code>brand</code>
              </td>
              <td>
                <code>{brand}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">semantic</th>
              <td>
                <code>--color-action</code>
              </td>
              <td>
                <span className="swatch-inline" aria-hidden="true" />
                <code>{current[theme]}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">component</th>
              <td>
                <code>--button-bg</code>
              </td>
              <td>
                <code>var(--color-action)</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="s01-modes">
        <fieldset className="seg">
          <legend>Theme</legend>
          {THEMES.map((t) => (
            <label key={t.id} className="seg-opt">
              <input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
        <div className="sync">
          <button type="button" className="btn btn-ghost" onClick={runSync}>
            Simulate Figma → deploy
          </button>
          <ol className="sync-steps" aria-label="Simulated sync. The Figma Variables API needs an Enterprise plan.">
            {SYNC.map((s, i) => (
              <li key={s} data-state={sync > i ? "done" : sync === i ? "now" : "todo"}>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
