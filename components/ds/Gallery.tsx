"use client";

import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Button } from "./Button";

// Every component and every state, side by side. Previews use the real classes from
// globals.css; hover, focus and pressed are forced with data-force so they show at rest.
// The rules for each component (when to use it, when not) live in design-skills/components.md.

type Force = "hover" | "focus" | "active";
type State = { label: string; force?: Force; dir?: "rtl"; node: ReactNode };
type Spec = { id: string; name: string; use: string; source: string; wide?: boolean; states: State[] };

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "hc", label: "High contrast" },
] as const;
type PreviewTheme = (typeof THEMES)[number]["id"];

const Close = () => <span aria-hidden="true">✕</span>;

const Seg = ({ name, checked }: { name: string; checked: number }) => (
  <fieldset className="seg">
    <legend>Theme</legend>
    {["Light", "Dark"].map((l, i) => (
      <label key={l} className="seg-opt">
        <input type="radio" name={name} defaultChecked={i === checked} tabIndex={-1} />
        <span>{l}</span>
      </label>
    ))}
  </fieldset>
);

const Field = ({ value = "", error, help, disabled }: { value?: string; error?: string; help?: string; disabled?: boolean }) => (
  <label className="field dsg-field" data-invalid={error ? "true" : undefined}>
    <span>Email</span>
    <input type="email" defaultValue={value} disabled={disabled} aria-invalid={error ? true : undefined} tabIndex={-1} />
    {error ? (
      <span className="dsg-field-msg is-error">
        <span aria-hidden="true">!</span> {error}
      </span>
    ) : help ? (
      <span className="dsg-field-msg">{help}</span>
    ) : null}
  </label>
);

const Conf = ({ level, icon }: { level: "understood" | "unsure" | "assumed"; icon: string }) => (
  <div className="assumption" data-confidence={level}>
    <p className="assumption-line">
      <span className="conf">
        <span className="conf-icon" aria-hidden="true">
          {icon}
        </span>
        {level}
      </span>
      <span>Timeline: 6 weeks</span>
    </p>
  </div>
);

const SPECS: Spec[] = [
  {
    id: "button",
    name: "Button",
    use: "An action that changes something.",
    source: "components/ds/Button.tsx",
    states: [
      { label: "Default", node: <Button>Save plan</Button> },
      { label: "Hover", force: "hover", node: <Button>Save plan</Button> },
      { label: "Focus-visible", force: "focus", node: <Button>Save plan</Button> },
      { label: "Pressed", force: "active", node: <Button>Save plan</Button> },
      { label: "Disabled", node: <Button disabled>Save plan</Button> },
      { label: "Loading", node: <Button loading>Save plan</Button> },
      { label: "Secondary", node: <Button variant="secondary">Cancel</Button> },
      { label: "Destructive", node: <Button variant="destructive">Delete</Button> },
      { label: "Small", node: <Button size="sm">Save plan</Button> },
      { label: "Icon only", node: <Button iconOnly aria-label="Close" icon={<Close />} /> },
      { label: "RTL", dir: "rtl", node: <Button>حفظ</Button> },
    ],
  },
  {
    id: "page-button",
    name: "Page button",
    use: "Buttons in the page chrome: navigation bars, stop footers, toolbars.",
    source: ".btn in globals.css",
    states: [
      { label: "Primary", node: <button className="btn btn-primary">Next stop</button> },
      { label: "Default", node: <button className="btn">Reset</button> },
      { label: "Hover", force: "hover", node: <button className="btn">Reset</button> },
      { label: "Focus-visible", force: "focus", node: <button className="btn">Reset</button> },
      { label: "Pressed", node: <button className="btn" aria-pressed="true">Reset</button> },
      { label: "Ghost", node: <button className="btn btn-ghost">Previous</button> },
      { label: "Small", node: <button className="btn btn-small">6 weeks</button> },
      { label: "Disabled", node: <button className="btn" disabled>Reset</button> },
    ],
  },
  {
    id: "link-and-link-button",
    name: "Link and link button",
    use: "A link goes somewhere. A link button is a quiet action that looks like text.",
    source: "<a>, .link-btn",
    states: [
      { label: "Link", node: <a href="#components">Source</a> },
      { label: "Link hover", force: "hover", node: <a href="#components">Source</a> },
      { label: "Link focus", force: "focus", node: <a href="#components">Source</a> },
      { label: "Link button", node: <button className="link-btn">Show prompt</button> },
      { label: "Link button focus", force: "focus", node: <button className="link-btn">Show prompt</button> },
    ],
  },
  {
    id: "filter-and-segmented-control",
    name: "Filter and segmented control",
    use: "A filter narrows what is shown. A segment picks one mode from two to five.",
    source: ".filter, .seg",
    states: [
      { label: "Filter off", node: <button className="filter">Design system</button> },
      { label: "Filter hover", force: "hover", node: <button className="filter">Design system</button> },
      { label: "Filter on", node: <button className="filter" aria-pressed="true">Design system</button> },
      { label: "Filter focus", force: "focus", node: <button className="filter">Design system</button> },
      { label: "Segment", node: <Seg name="dsg-seg-a" checked={0} /> },
      { label: "Segment focus", force: "focus", node: <Seg name="dsg-seg-b" checked={1} /> },
    ],
  },
  {
    id: "switch",
    name: "Switch",
    use: "An on/off setting that takes effect at once.",
    source: ".switch",
    states: [
      {
        label: "Off",
        node: (
          <label className="switch">
            <input type="checkbox" role="switch" tabIndex={-1} /> Show focus order
          </label>
        ),
      },
      {
        label: "On",
        node: (
          <label className="switch">
            <input type="checkbox" role="switch" defaultChecked tabIndex={-1} /> Show focus order
          </label>
        ),
      },
      {
        label: "Focus-visible",
        force: "focus",
        node: (
          <label className="switch">
            <input type="checkbox" role="switch" tabIndex={-1} /> Show focus order
          </label>
        ),
      },
      {
        label: "Disabled",
        node: (
          <label className="switch is-disabled">
            <input type="checkbox" role="switch" disabled /> Show focus order
          </label>
        ),
      },
    ],
  },
  {
    id: "field",
    name: "Field",
    use: "A visible label, the control, and helper or error text.",
    source: ".field",
    wide: true,
    states: [
      { label: "Empty", node: <Field /> },
      { label: "Filled", node: <Field value="sam@studio.com" /> },
      { label: "Focus-visible", force: "focus", node: <Field value="sam@" /> },
      { label: "Helper text", node: <Field help="We only use it to send the plan." /> },
      { label: "Error", node: <Field value="sam@" error="Enter a full email address, like name@site.com" /> },
      { label: "Disabled", node: <Field value="sam@studio.com" disabled /> },
    ],
  },
  {
    id: "badge",
    name: "Badge",
    use: "A short status label with an icon. Never clickable.",
    source: ".badge",
    states: [
      {
        label: "Neutral",
        node: (
          <span className="badge" data-tone="neutral">
            <span aria-hidden="true">❚❚</span> Paused
          </span>
        ),
      },
      {
        label: "OK",
        node: (
          <span className="badge" data-tone="ok">
            <span aria-hidden="true">✓</span> Approved
          </span>
        ),
      },
      {
        label: "Warn",
        node: (
          <span className="badge" data-tone="warn">
            <span aria-hidden="true">!</span> Needs review
          </span>
        ),
      },
      {
        label: "Scripted run",
        node: (
          <span className="badge badge-scripted">
            <span aria-hidden="true">●</span> Scripted run
          </span>
        ),
      },
    ],
  },
  {
    id: "chip",
    name: "Chip",
    use: "A compact item in a row: a tag, or a stop in the rail.",
    source: ".chip, .rail-chip",
    states: [
      { label: "Chip", node: <span className="chip">CSS variables</span> },
      {
        label: "Rail chip",
        node: (
          <a className="rail-chip" href="#components">
            <span className="rail-num">04</span>
            <span className="rail-time">40 s</span>
          </a>
        ),
      },
      {
        label: "Current",
        node: (
          <a className="rail-chip" href="#components" aria-current="step">
            <span className="rail-num">04</span>
            <span className="rail-time">40 s</span>
          </a>
        ),
      },
      {
        label: "Stamped",
        node: (
          <a className="rail-chip is-stamped" href="#components">
            <span className="rail-num">04</span>
            <span className="rail-time">40 s</span>
            <span className="rail-tick" aria-hidden="true">
              ✓
            </span>
          </a>
        ),
      },
      {
        label: "Focus-visible",
        force: "focus",
        node: (
          <a className="rail-chip" href="#components">
            <span className="rail-num">04</span>
            <span className="rail-time">40 s</span>
          </a>
        ),
      },
    ],
  },
  {
    id: "card-and-emptystate",
    name: "Card and empty state",
    use: "A card groups one object with its actions. An empty state explains why and offers one next step.",
    source: ".demo-card, .empty-state",
    wide: true,
    states: [
      {
        label: "Card",
        node: (
          <article className="demo-card dsg-card">
            <div className="demo-card-band" style={{ ["--demo-brand" as string]: "var(--color-action)" }}>
              <p className="demo-card-kicker">New</p>
              <p className="demo-card-title">Spring design review</p>
            </div>
            <div className="demo-card-body">
              <p>Thursday · 30 min</p>
              <span className="demo-btn">Join call</span>
            </div>
          </article>
        ),
      },
      {
        label: "Empty state",
        node: (
          <div className="empty-state dsg-card">
            <span className="empty-icon" aria-hidden="true">
              ◌
            </span>
            <p className="empty-title">No projects yet</p>
            <p className="empty-body">Projects you save show up here.</p>
            <span className="demo-btn">Start one</span>
          </div>
        ),
      },
    ],
  },
  {
    id: "step-rail",
    name: "Step rail",
    use: "A visible list of steps for agents and pipelines. Progress is honest.",
    source: ".step-rail",
    wide: true,
    states: [
      {
        label: "Waiting, running, done",
        node: (
          <ol className="step-rail">
            <li data-state="done">Read brief</li>
            <li data-state="now">Draft plan</li>
            <li data-state="todo">Check copy</li>
          </ol>
        ),
      },
      {
        label: "All done",
        node: (
          <ol className="step-rail">
            <li data-state="done">Read brief</li>
            <li data-state="done">Draft plan</li>
            <li data-state="done">Check copy</li>
          </ol>
        ),
      },
    ],
  },
  {
    id: "confidence-and-assumption",
    name: "Confidence",
    use: "How sure the AI is, as a word, an icon and a colour. Never a percentage.",
    source: ".assumption, .conf",
    wide: true,
    states: [
      { label: "Understood", node: <Conf level="understood" icon="✓" /> },
      { label: "Unsure", node: <Conf level="unsure" icon="?" /> },
      { label: "Assumed", node: <Conf level="assumed" icon="!" /> },
    ],
  },
  {
    id: "kbd",
    name: "Kbd",
    use: "A keyboard key in a hint. Always next to a clickable alternative.",
    source: "<kbd>",
    states: [
      { label: "Single key", node: <kbd>?</kbd> },
      {
        label: "Range",
        node: (
          <span>
            <kbd>1</kbd>–<kbd>0</kbd>
          </span>
        ),
      },
      {
        label: "In a button",
        node: (
          <button className="btn btn-small">
            Undo <kbd>⌘ Z</kbd>
          </button>
        ),
      },
    ],
  },
];

export function ComponentGallery() {
  const site = useStore().theme;
  // Follows the site theme until the visitor picks one here.
  const [picked, setTheme] = useState<PreviewTheme | null>(null);
  const theme = picked ?? site;
  return (
    <section id="components" className="dsys-section dsg-section" aria-labelledby="components-title">
      <div className="dsg-head">
        <div>
          <h2 id="components-title" className="md-h2">
            Components
          </h2>
          <p className="muted">Every component and every state, in one place. Switch the theme to check them all at once.</p>
        </div>
        <fieldset className="seg">
          <legend>Preview theme</legend>
          {THEMES.map((t) => (
            <label key={t.id} className="seg-opt">
              <input type="radio" name="dsg-theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="dsg" data-theme={theme}>
        {SPECS.map((c) => (
          <section key={c.id} id={`components-${c.id}`} className="dsg-comp" aria-labelledby={`components-${c.id}-name`}>
            <header className="dsg-comp-head">
              <h3 id={`components-${c.id}-name`} className="dsg-name">
                {c.name}
              </h3>
              <p className="dsg-use">{c.use}</p>
              <code className="dsg-source">{c.source}</code>
            </header>
            <ul className={`dsg-states ${c.wide ? "is-wide" : ""}`}>
              {c.states.map((s) => (
                <li key={s.label} className="dsg-tile">
                  {/* Specimens are pictures of states, so they're inert: no duplicate tab stops. */}
                  <div className="dsg-preview" data-force={s.force} dir={s.dir} inert>
                    {s.node}
                  </div>
                  <p className="dsg-label">{s.label}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
