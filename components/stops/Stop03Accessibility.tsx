"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Marker, useStop } from "../Stop";

type IssueId = "label" | "select-name" | "button-name" | "color-contrast" | "keyboard";

const ISSUES: Record<IssueId, { title: string; wcag: string; weight: number; by: "axe-core" | "custom check"; diff: [string, string] }> = {
  label: { title: "Fields use a placeholder as the label", wcag: "3.3.2 Labels or Instructions", weight: 15, by: "custom check", diff: ['<input placeholder="Email" />', '<label for="email">Email</label>\n<input id="email" placeholder="you@studio.com" />'] },
  "select-name": { title: "Plan picker has no name", wcag: "4.1.2 Name, Role, Value", weight: 12, by: "axe-core", diff: ["<select>", '<label for="plan">Plan</label>\n<select id="plan">'] },
  "button-name": { title: "Icon button has no name", wcag: "4.1.2 Name, Role, Value", weight: 12, by: "axe-core", diff: ["<button><EyeIcon /></button>", '<button aria-label="Show password"><EyeIcon /></button>'] },
  "color-contrast": { title: "Hint text is too faint", wcag: "1.4.3 Contrast (Minimum)", weight: 8, by: "axe-core", diff: ["color: #a3a3a3; /* hard-coded */", "color: var(--color-text-muted);"] },
  keyboard: { title: "Subscribe can't be reached with Tab", wcag: "2.1.1 Keyboard", weight: 12, by: "custom check", diff: ["<div onClick={submit}>Subscribe</div>", '<button type="submit">Subscribe</button>'] },
};
const ORDER: IssueId[] = ["keyboard", "label", "button-name", "select-name", "color-contrast"];
const FAINT = { light: "#a3a3a3", dark: "#55534b", hc: "#55534b" } as const;

function accessibleName(el: HTMLElement): string {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const id = el.id;
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${id}"]`);
    if (label?.textContent) return label.textContent.trim();
  }
  if (el.tagName === "BUTTON") return el.textContent?.trim() || "";
  return "";
}

export default function Stop03Accessibility() {
  const { theme } = useStore();
  const { complete } = useStop();
  const formRef = useRef<HTMLFormElement>(null);
  const [fixed, setFixed] = useState<Set<IssueId>>(new Set());
  const [found, setFound] = useState<IssueId[] | null>(null);
  const [running, setRunning] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [names, setNames] = useState<{ role: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const is = (id: IssueId) => fixed.has(id);

  const score = 100 - ORDER.filter((id) => !fixed.has(id)).reduce((n, id) => n + ISSUES[id].weight, 0);

  const runId = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  // axe-core refuses overlapping runs, so checks are queued; only the newest result is kept.
  const check = () => {
    const id = ++runId.current;
    setRunning(true);
    queue.current = queue.current.then(async () => {
      const form = formRef.current;
      if (!form || id !== runId.current) return;
      const axe = (await import("axe-core")).default;
      const res = await axe.run(form, { runOnly: { type: "rule", values: ["select-name", "button-name", "color-contrast"] } });
      const ids = new Set(res.violations.map((v) => v.id as IssueId));
      // axe accepts a placeholder as a name. We are stricter: a placeholder vanishes as you type.
      const unlabelled = [...form.querySelectorAll<HTMLInputElement>("input")].some((i) => !form.querySelector(`label[for="${i.id}"]`));
      if (unlabelled) ids.add("label");
      // axe can't see a click handler on a div, so this one is checked in code too.
      const clickable = form.querySelector("[data-clickable]");
      if (clickable && !(clickable as HTMLElement).matches("button, [tabindex]")) ids.add("keyboard");
      if (id !== runId.current) return; // a newer check is queued behind this one
      setFound(ORDER.filter((x) => ids.has(x)));
      setRunning(false);
    }).catch((err: unknown) => {
      // Keep the queue alive. A failed run must never block the next check.
      console.error("axe check failed", err);
      setRunning(false);
    });
  };

  // Re-run after each fix so the list reflects the real DOM.
  useEffect(() => {
    if (found !== null) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixed, theme]);

  useEffect(() => {
    if (score === 100) complete();
  }, [score, complete]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const els = [...form.querySelectorAll<HTMLElement>("input, select, button")];
    setNames(els.map((el) => ({ role: el.tagName === "SELECT" ? "combobox" : el.tagName === "BUTTON" ? "button" : "textbox", name: accessibleName(el) })));
  }, [fixed]);

  const focusables = overlay ? [...(formRef.current?.querySelectorAll<HTMLElement>("input, select, button") ?? [])] : [];
  const order = (el: string) => (overlay ? focusables.findIndex((f) => f.dataset.fo === el) + 1 : 0);

  return (
    <div className="s03">
      <Marker n={1} className="s03-form-wrap">
        <form
          ref={formRef}
          className={`s03-form ${overlay ? "show-order" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          data-axe-demo="intentional-issues"
          style={{ ["--s03-faint" as string]: FAINT[theme] }}
          aria-label="Newsletter sign-up demo"
        >
          <div className="s03-row">
            {is("label") && <label htmlFor="s03-email">Email</label>}
            <input id="s03-email" data-fo="email" type="email" placeholder={is("label") ? "you@studio.com" : "Email"} autoComplete="off" />
            {overlay && <span className="fo">{order("email")}</span>}
          </div>
          <div className="s03-row s03-pw">
            {is("label") && <label htmlFor="s03-pw">Password</label>}
            <input id="s03-pw" data-fo="pw" type="password" placeholder={is("label") ? "" : "Password"} autoComplete="off" />
            <button type="button" data-fo="eye" className="eye" aria-label={is("button-name") ? "Show password" : undefined}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </button>
            {overlay && <span className="fo">{order("pw")}</span>}
          </div>
          <div className="s03-row">
            {is("select-name") && <label htmlFor="s03-plan">Plan</label>}
            <select id="s03-plan" data-fo="plan" defaultValue="monthly">
              <option value="monthly">Monthly digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          <p className={is("color-contrast") ? "s03-hint" : "s03-hint is-faint"}>
            We send one email a month. Unsubscribe any time.
          </p>
          {is("keyboard") ? (
            <button type="submit" className="btn btn-primary" data-fo="submit" data-clickable>
              Subscribe
            </button>
          ) : (
            <div className="fake-btn" data-clickable onClick={() => setSubmitted(true)}>
              Subscribe
            </div>
          )}
          {submitted && <p className="ok-text">Subscribed. (It's a demo, nothing was sent.)</p>}
        </form>
      </Marker>

      <div className="s03-panel">
        <div className="s03-score" aria-live="polite">
          <span className="s03-score-num" data-full={score === 100 || undefined}>
            {score}
          </span>
          <span>/ 100 accessibility score</span>
        </div>
        <div className="s03-actions">
          <button type="button" className="btn btn-primary" onClick={check} disabled={running}>
            {running ? "Checking…" : found ? "Run check again" : "Run check"}
          </button>
          <label className="switch">
            <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
            Show focus order
          </label>
        </div>
        {found && (
          <Marker n={3}>
            <ul className="issues">
              {found.length === 0 && (
                <li className="ok-text">
                  <span aria-hidden="true">✓</span> No issues. Tab through the form: it works without a mouse now.
                </li>
              )}
              {found.map((id, i) => (
                <li key={id} className="issue">
                  <div>
                    <p className="issue-title">
                      <span aria-hidden="true">✕</span> {ISSUES[id].title}
                    </p>
                    <p className="issue-wcag">
                      {ISSUES[id].wcag} · {ISSUES[id].by}
                    </p>
                    {i === 0 && (
                    <pre className="diff">
                      <code>
                        <span className="del">- {ISSUES[id].diff[0]}</span>
                        {"\n"}
                        <span className="add">+ {ISSUES[id].diff[1].replace(/\n/g, "\n+ ")}</span>
                      </code>
                    </pre>
                    )}
                  </div>
                  <button type="button" className="btn btn-small" onClick={() => setFixed((f) => new Set(f).add(id))}>
                    Fix<span className="sr-only">: {ISSUES[id].title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Marker>
        )}
        <Marker n={2}>
          <div className="names">
            <p className="names-title">What a screen reader announces</p>
            <ul>
              {names.map((n, i) => (
                <li key={i}>
                  <span className="muted">{n.role}</span> <span className={n.name ? "" : "is-missing"}>{n.name ? `“${n.name}”` : "(no name)"}</span>
                </li>
              ))}
            </ul>
          </div>
        </Marker>
      </div>
    </div>
  );
}
