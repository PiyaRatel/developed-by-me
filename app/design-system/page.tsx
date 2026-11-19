import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Fragment } from "react";
import { ComponentGallery } from "@/components/ds/Gallery";
import { Markdown } from "@/lib/markdown";
import tokens from "@/tokens/tokens.json";

export const metadata: Metadata = {
  title: "Design system · Developed by Me",
  description: "Tokens, components, interaction patterns, writing style and accessibility rules for Developed by Me.",
};

// The page renders design-skills/*.md directly, so the docs and the page can't drift apart.
// Components is the exception: it shows a visual gallery of every state instead of the
// written rules, which stay in design-skills/components.md for people and agents.
const DOCS = [
  { id: "overview", file: "SKILL.md", label: "Overview" },
  { id: "tokens", file: "tokens.md", label: "Tokens" },
  { id: "components", file: "components.md", label: "Components" },
  { id: "patterns", file: "interaction-patterns.md", label: "Interaction patterns" },
  { id: "writing", file: "writing-style.md", label: "Writing style" },
  { id: "accessibility", file: "accessibility.md", label: "Accessibility" },
] as const;

const read = (file: string) => readFileSync(path.join(process.cwd(), "design-skills", file), "utf8");

/** Links between docs (tokens.md, components.md#x) become anchors on this page. */
function resolve(href: string) {
  const [file, hash] = href.split("#");
  const doc = DOCS.find((d) => d.file === file);
  if (!doc) return href;
  return hash ? `#${doc.id}-${hash}` : `#${doc.id}`;
}

const THEMES = ["light", "dark", "hc"] as const;
const THEME_LABEL = { light: "Light", dark: "Dark", hc: "High contrast" };
const SEMANTIC = Object.keys(tokens.semantic.light);
const SPACES = Object.keys(tokens.density.comfortable).filter((k) => k.startsWith("space-"));
const SIZES = Object.keys(tokens.primitive.size);
const RADII = Object.keys(tokens.primitive.radius);
const DURATIONS = Object.entries(tokens.primitive.duration).map(([k, v]) => [k, v.$value] as const);

function Foundations() {
  return (
    <section className="dsys-section" aria-labelledby="foundations">
      <h2 id="foundations" className="md-h2">
        Live foundations
      </h2>
      <p className="muted">
        Read from <code>tokens/tokens.json</code> and drawn with the real CSS variables. Pick a brand colour at stop 01 and these swatches update too.
      </p>

      <h3 className="md-h3">Semantic colour, in every theme</h3>
      <div className="md-table-wrap" tabIndex={0} role="region" aria-label="Semantic colour tokens by theme">
        <table className="md-table dsys-colors">
          <thead>
            <tr>
              <th scope="col">Token</th>
              {THEMES.map((t) => (
                <th key={t} scope="col">
                  {THEME_LABEL[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEMANTIC.map((name) => (
              <tr key={name}>
                <th scope="row">
                  <code>--color-{name}</code>
                </th>
                {THEMES.map((t) => (
                  <td key={t}>
                    <span className="dsys-swatch-cell" data-theme={t}>
                      <span className="dsys-swatch" style={{ background: `var(--color-${name})` }} aria-hidden="true" />
                      <span className="dsys-swatch-sample" style={{ color: `var(--color-${name})` }} aria-hidden="true">
                        Aa
                      </span>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dsys-foundation-grid">
        <div>
          <h3 className="md-h3">Space</h3>
          <ul className="dsys-scale">
            {SPACES.map((s) => (
              <li key={s}>
                <code>--{s}</code>
                <span className="dsys-space" style={{ inlineSize: `var(--${s})` }} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="md-h3">Radius</h3>
          <ul className="dsys-scale dsys-radii">
            {RADII.map((r) => (
              <li key={r}>
                <span className="dsys-radius" style={{ borderRadius: `var(--radius-${r})` }} aria-hidden="true" />
                <code>--radius-{r}</code>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="md-h3">Motion</h3>
          <ul className="dsys-scale">
            {DURATIONS.map(([k, v]) => (
              <li key={k}>
                <code>--duration-{k}</code> <span className="muted">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="md-h3">Type scale</h3>
      <ul className="dsys-type">
        {SIZES.map((s) => (
          <li key={s}>
            <code>--size-{s}</code>
            <span style={{ fontSize: `var(--size-${s})` }} className={s === "display" || s === "6" || s === "5" ? "display" : undefined}>
              Clear, warm, precise
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <a className="skip-link" href="#dsys-main">
        Skip to content
      </a>
      <header className="topbar dsys-topbar">
        <div className="topbar-row">
          <Link className="wordmark" href="/">
            Developed <em>by</em> Me
          </Link>
          <Link className="btn btn-small" href="/">
            <span aria-hidden="true">←</span> Back to the tour
          </Link>
        </div>
      </header>

      <div className="dsys">
        <nav className="dsys-nav" aria-label="Design system sections">
          <ol>
            {DOCS.map((d) => (
              <Fragment key={d.id}>
                <li>
                  <a href={`#${d.id}`}>{d.label}</a>
                </li>
                {d.id === "tokens" && (
                  <li className="dsys-nav-sub">
                    <a href="#foundations">Live foundations</a>
                  </li>
                )}
              </Fragment>
            ))}
          </ol>
          <p className="dsys-nav-note muted">
            Source: <code>design-skills/</code>
          </p>
        </nav>

        <main id="dsys-main" className="dsys-main">
          <header className="dsys-hero">
            <p className="eyebrow">Design skills</p>
            <h1 className="display dsys-title">Design system</h1>
            <p className="intro-lede">
              The rules behind every stop: tokens, components and when not to use them, interaction and AI patterns, writing style and accessibility. Written for people and for agents.
            </p>
          </header>

          {DOCS.map((d) => (
            <Fragment key={d.id}>
              {d.id === "components" ? (
                <ComponentGallery />
              ) : (
                <section id={d.id} className="dsys-section dsys-doc" aria-label={d.label}>
                  <Markdown source={read(d.file)} idPrefix={d.id} resolve={resolve} />
                </section>
              )}
              {d.id === "tokens" && <Foundations />}
            </Fragment>
          ))}
        </main>
      </div>
    </>
  );
}

