"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE, STOPS } from "@/lib/content";
import { SAMPLE_PLAN } from "@/lib/plan";
import { useStore, type SavedCopy, type Theme } from "@/lib/store";
import { brandScale } from "@/lib/color";

type CardData = { theme: Theme; brand: string; goal: string; steps: string[]; copy: SavedCopy | null; stamps: number };

const encode = (d: CardData) => btoa(unescape(encodeURIComponent(JSON.stringify(d))));
function decode(s: string): CardData | null {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(s)))) as CardData;
    if (typeof d.goal !== "string" || !Array.isArray(d.steps)) return null;
    // Shared links are untrusted input: whitelist every field.
    return {
      theme: (["light", "dark", "hc"] as const).includes(d.theme) ? d.theme : "light",
      brand: /^#[0-9a-f]{6}$/i.test(d.brand) ? d.brand : "#3b4bdb",
      goal: d.goal.slice(0, 120),
      steps: d.steps.slice(0, 5).map((s) => String(s).slice(0, 80)),
      copy: d.copy ? { title: String(d.copy.title).slice(0, 40), body: String(d.copy.body).slice(0, 120), cta: String(d.copy.cta).slice(0, 20) } : null,
      stamps: Math.min(10, Math.max(0, Number(d.stamps) || 0)),
    };
  } catch {
    return null;
  }
}

function PlanCard({ d, label }: { d: CardData; label: string }) {
  const brand = brandScale(d.brand);
  return (
    <article
      className="plan-card"
      data-theme={d.theme}
      style={{ ["--brand-light" as string]: brand.light, ["--brand-dark" as string]: brand.dark, ["--brand-hc" as string]: brand.hc }}
      aria-label={label}
    >
      <header>
        <p className="eyebrow">Your Plan It</p>
        <h3>{d.goal}</h3>
      </header>
      <ol>
        {d.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {d.copy && (
        <blockquote>
          <strong>{d.copy.title}</strong> {d.copy.body} <span className="plan-cta">{d.copy.cta}</span>
        </blockquote>
      )}
      <footer>
        <span className="swatch" aria-hidden="true" />
        <span>
          Theme: {d.theme === "hc" ? "high contrast" : d.theme} · Brand {d.brand} · {d.stamps} of 10 stamps
        </span>
      </footer>
    </article>
  );
}

const SHAPES = ["circle", "square", "tri"] as const;
const COLORS = ["var(--color-action)", "var(--color-pop-lime)", "var(--color-pop-coral)", "var(--color-pop-sky)", "var(--color-pop-sun)"];

function Burst() {
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        shape: SHAPES[i % 3]!,
        color: COLORS[i % COLORS.length]!,
        x: Math.cos((i / 28) * Math.PI * 2) * (120 + (i % 4) * 40),
        y: Math.sin((i / 28) * Math.PI * 2) * (120 + (i % 3) * 40),
      })),
    [],
  );
  return (
    <div className="burst" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} className={`bit bit-${b.shape}`} style={{ ["--x" as string]: `${b.x}px`, ["--y" as string]: `${b.y}px`, ["--c" as string]: b.color }} />
      ))}
    </div>
  );
}

export function Finale({ hidden }: { hidden?: boolean }) {
  const { stamps, theme, brand, plan, savedCopy, justStamped, reset } = useStore();
  const [shared, setShared] = useState<CardData | null>(null);
  const [copied, setCopied] = useState(false);
  const unlocked = stamps.length === 10;
  const p = plan ?? SAMPLE_PLAN;
  const data: CardData = {
    theme,
    brand,
    goal: p.params.goal,
    steps: p.cards.map((c) => p.overrides[c.id] ?? c.title),
    copy: savedCopy,
    stamps: stamps.length,
  };

  useEffect(() => {
    const c = new URLSearchParams(location.search).get("card");
    if (c) setShared(decode(c));
  }, []);

  const share = async () => {
    const url = `${location.origin}${location.pathname}?card=${encodeURIComponent(encode(data))}#finale`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const missing = STOPS.filter((s) => !stamps.includes(s.n));

  return (
    <section id="finale" className="finale" aria-labelledby="finale-title" hidden={hidden}>
      {justStamped !== null && unlocked && <Burst />}
      <h2 id="finale-title" className="display" tabIndex={-1}>
        {unlocked ? "Passport full. Here's your plan." : "Your Plan It"}
      </h2>
      {shared && (
        <div className="finale-shared">
          <p>Someone shared their card with you:</p>
          <PlanCard d={shared} label="Shared plan card" />
        </div>
      )}
      {unlocked ? (
        <div className="finale-body">
          <PlanCard d={data} label="Your plan card" />
          <div className="finale-actions">
            <p>Built from your theme (stop 01), your plan (stop 04) and the copy you saved (stop 05).</p>
            <button type="button" className="btn btn-primary" onClick={share}>
              {copied ? "Link copied" : "Copy share link"}
            </button>
            <a className="btn" href={SITE.caseStudy}>
              Read the case study <span aria-hidden="true">→</span>
            </a>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Start the tour again
            </button>
          </div>
        </div>
      ) : (
        <div className="finale-locked">
          <p className="claim">
            {stamps.length} of 10 stamps. Your card unlocks at 10. {missing.length <= 3 && `Still to go: ${missing.map((s) => s.stamp).join(", ")}.`}
          </p>
          <div className="plan-card is-locked" aria-hidden="true">
            <span>🔒</span>
          </div>
        </div>
      )}
    </section>
  );
}
