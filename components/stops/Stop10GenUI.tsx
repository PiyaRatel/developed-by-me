"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { SAMPLE_PLAN } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { Marker, useStop } from "../Stop";

type Goal = "study" | "trip" | "launch" | "budget";
type View = "list" | "board" | "timeline" | "chart";
type ModuleType = "schedule" | "tasks" | "spending" | "itinerary";
type Item = { id: string; label: string; day: number; amount?: number; status: "todo" | "doing" | "done" };

// The module registry: a fixed set, each with a schema of allowed views.
const MODULES: Record<ModuleType, { title: string; views: View[] }> = {
  schedule: { title: "Schedule", views: ["timeline", "list"] },
  tasks: { title: "Tasks", views: ["board", "list"] },
  spending: { title: "Spending", views: ["chart", "list"] },
  itinerary: { title: "Itinerary", views: ["timeline", "list"] },
};

const State = z.object({
  goal: z.enum(["study", "trip", "launch", "budget"]),
  modules: z.array(z.object({ id: z.string().max(12), type: z.enum(["schedule", "tasks", "spending", "itinerary"]), view: z.enum(["list", "board", "timeline", "chart"]) })).max(4),
});
type UIState = z.infer<typeof State>;

const LAYOUTS: Record<Goal, { why: string; modules: UIState["modules"] }> = {
  study: { why: "You're studying, so time comes first: a schedule, then what's due.", modules: [{ id: "m1", type: "schedule", view: "timeline" }, { id: "m2", type: "tasks", view: "board" }] },
  trip: { why: "Trips run on days and money, so the itinerary leads and spending sits next to it.", modules: [{ id: "m1", type: "itinerary", view: "timeline" }, { id: "m2", type: "spending", view: "chart" }] },
  launch: { why: "A launch is a list of moving parts, so your plan from stop 04 becomes a board.", modules: [{ id: "m1", type: "tasks", view: "board" }, { id: "m2", type: "schedule", view: "timeline" }] },
  budget: { why: "Budgets are about proportions, so a chart leads and the list backs it up.", modules: [{ id: "m1", type: "spending", view: "chart" }, { id: "m2", type: "tasks", view: "list" }] },
};

const GOALS: { id: Goal; label: string }[] = [
  { id: "study", label: "Study for an exam" },
  { id: "trip", label: "Plan a trip" },
  { id: "launch", label: "Launch a project" },
  { id: "budget", label: "Set a budget" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function data(goal: Goal, planSteps: string[]): Item[] {
  switch (goal) {
    case "study":
      return [
        { id: "a", label: "Read chapter 4", day: 0, status: "done" },
        { id: "b", label: "Flashcards", day: 1, status: "doing" },
        { id: "c", label: "Mock exam", day: 3, status: "todo" },
        { id: "d", label: "Review mistakes", day: 4, status: "todo" },
      ];
    case "trip":
      return [
        { id: "a", label: "Fly to Lisbon", day: 0, amount: 180, status: "done" },
        { id: "b", label: "Tram 28 and Alfama", day: 1, amount: 12, status: "doing" },
        { id: "c", label: "Sintra day trip", day: 2, amount: 40, status: "todo" },
        { id: "d", label: "Fado dinner", day: 3, amount: 55, status: "todo" },
      ];
    case "launch":
      return planSteps.slice(0, 5).map((label, i) => ({ id: String(i), label, day: i, status: i === 0 ? "done" : i === 1 ? "doing" : "todo" }));
    case "budget":
      return [
        { id: "a", label: "Rent", day: 0, amount: 1200, status: "done" },
        { id: "b", label: "Groceries", day: 1, amount: 320, status: "doing" },
        { id: "c", label: "Transport", day: 2, amount: 90, status: "todo" },
        { id: "d", label: "Fun", day: 4, amount: 150, status: "todo" },
      ];
  }
}

function ModuleView({ view, items }: { view: View; items: Item[] }) {
  if (view === "board")
    return (
      <div className="v-board">
        {(["todo", "doing", "done"] as const).map((s) => (
          <div key={s} className="v-col">
            <p className="v-col-head">{s === "todo" ? "To do" : s === "doing" ? "Doing" : "Done"}</p>
            <ul>
              {items.filter((i) => i.status === s).map((i) => (
                <li key={i.id}>{i.label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  if (view === "timeline")
    return (
      <ol className="v-timeline">
        {DAYS.map((d, di) => (
          <li key={d}>
            <span className="v-day">{d}</span>
            {items.filter((i) => i.day === di).map((i) => (
              <span key={i.id} className="v-event">
                {i.label}
              </span>
            ))}
          </li>
        ))}
      </ol>
    );
  if (view === "chart") {
    const max = Math.max(...items.map((i) => i.amount ?? 0), 1);
    return (
      <ul className="v-chart">
        {items.map((i) => (
          <li key={i.id}>
            <span className="v-chart-label">{i.label}</span>
            <span className="v-bar" style={{ inlineSize: `${((i.amount ?? 0) / max) * 100}%` }} />
            <span className="v-chart-val">€{i.amount}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="v-list">
      {items.map((i) => (
        <li key={i.id}>
          <span>{i.label}</span>
          <span className="muted">
            {DAYS[i.day]}
            {i.amount ? ` · €${i.amount}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function inView(id: string) {
  const r = document.getElementById(id)?.getBoundingClientRect();
  return !!r && r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4;
}

export default function Stop10GenUI() {
  const { plan } = useStore();
  const { complete } = useStop();
  const [state, setState] = useState<UIState>({ goal: "launch", modules: LAYOUTS.launch.modules });
  const [past, setPast] = useState<UIState[]>([]);
  const [did, setDid] = useState({ swap: false, reorder: false, undo: false });
  const [copied, setCopied] = useState(false);
  const p = plan ?? SAMPLE_PLAN;
  const steps = p.cards.map((c) => p.overrides[c.id] ?? c.title);
  const items = data(state.goal, steps);

  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("ui");
    if (!raw) return;
    try {
      const parsed = State.safeParse(JSON.parse(atob(raw)));
      if (parsed.success) setState(parsed.data);
    } catch {
      /* ignore bad links */
    }
  }, []);

  const commit = (next: UIState) => {
    setPast((h) => [...h, state].slice(-20));
    setState(next);
  };

  const undo = useCallback(() => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast(past.slice(0, -1));
    setState(prev);
    setDid((d) => ({ ...d, undo: true }));
  }, [past]);

  useEffect(() => {
    if (did.swap && did.reorder && did.undo) complete();
  }, [did, complete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey && inView("stop-10")) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const share = async () => {
    const url = `${location.origin}${location.pathname}?ui=${btoa(JSON.stringify(state))}#stop-10`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="s10">
      <fieldset className="goal-chips">
        <legend className="sr-only">Goal</legend>
        {GOALS.map((g) => (
          <label key={g.id} className="seg-opt">
            <input type="radio" name="goal" checked={state.goal === g.id} onChange={() => commit({ goal: g.id, modules: LAYOUTS[g.id].modules })} />
            <span>{g.label}</span>
          </label>
        ))}
      </fieldset>

      <Marker n={1}>
        <p className="why" aria-live="polite">
          <span className="why-label">Why this layout:</span> {LAYOUTS[state.goal].why}
        </p>
      </Marker>

      <Marker n={2} className="s10-grid-wrap">
        <ol className="s10-grid">
          {state.modules.map((m, i) => {
            const def = MODULES[m.type];
            return (
              <li key={m.id} className="module">
                <header className="module-head">
                  <h3>{def.title}</h3>
                  <span className="module-tools">
                    <Marker n={3} inline className="view-switch-wrap">
                      <span className="view-switch" role="group" aria-label={`${def.title} view`}>
                        {def.views.map((v) => (
                          <button
                            key={v}
                            type="button"
                            className="btn btn-small"
                            aria-pressed={m.view === v}
                            onClick={() => {
                              if (m.view === v) return;
                              commit({ ...state, modules: state.modules.map((x) => (x.id === m.id ? { ...x, view: v } : x)) });
                              setDid((d) => ({ ...d, swap: true }));
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </span>
                    </Marker>
                    <button
                      type="button"
                      className="btn btn-small btn-ghost"
                      aria-label={`Move ${def.title} ${i === 0 ? "down" : "up"}`}
                      onClick={() => {
                        const mods = [...state.modules].reverse();
                        commit({ ...state, modules: mods });
                        setDid((d) => ({ ...d, reorder: true }));
                      }}
                    >
                      {i === 0 ? "↓" : "↑"}
                    </button>
                  </span>
                </header>
                <ModuleView view={m.view} items={items} />
              </li>
            );
          })}
        </ol>
      </Marker>

      <div className="s10-foot">
        <button type="button" className="btn btn-small" onClick={undo} disabled={!past.length}>
          Undo <kbd>⌘/Ctrl Z</kbd>
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={share}>
          {copied ? "Layout link copied" : "Copy layout link"}
        </button>
        <span className="muted s10-progress">
          {did.swap ? "✓" : "○"} swap a view · {did.reorder ? "✓" : "○"} reorder · {did.undo ? "✓" : "○"} undo
        </span>
      </div>
    </div>
  );
}
