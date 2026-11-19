"use client";

import { useCallback, useEffect, useState } from "react";
import { affectedCards, assumptions, buildCards, SAMPLE_PLAN, type Confidence, type Plan } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { Marker, useStop } from "../Stop";

const ICON: Record<Confidence, string> = { understood: "✓", unsure: "?", assumed: "!" };

type Command = { label: string; before: Plan; confirmed: Record<string, boolean> };

function inView(id: string) {
  const r = document.getElementById(id)?.getBoundingClientRect();
  return !!r && r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4;
}

export default function Stop06Trust() {
  const { plan: saved, setPlan } = useStore();
  const { complete } = useStop();
  const [plan, setLocal] = useState<Plan>(saved ?? SAMPLE_PLAN);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<Command[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [changed, setChanged] = useState<string[]>([]);
  const [fixedWeeks, setFixedWeeks] = useState(false);

  useEffect(() => {
    if (saved && saved !== plan && history.length === 0) setLocal(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const list = assumptions(plan, { weeks: !!confirmed.weeks });

  const apply = (label: string, next: Plan, nextConfirmed: Record<string, boolean>, touched: string[]) => {
    setHistory((h) => [...h, { label, before: plan, confirmed }]);
    setLog((l) => [...l, label]);
    setLocal(next);
    setConfirmed(nextConfirmed);
    setChanged(touched);
    if (next.source === "visitor") setPlan(next);
  };

  const setWeeks = (weeks: number) => {
    if (weeks === plan.params.weeks) return apply(`Confirmed ${weeks} weeks`, plan, { ...confirmed, weeks: true }, []);
    const params = { ...plan.params, weeks };
    const fresh = buildCards(params, plan.variants);
    const touched = affectedCards(plan, "weeks");
    // Only the cards that depend on the timeline are recomputed. The rest keep their text.
    const cards = plan.cards.map((c) => (touched.includes(c.id) ? fresh.find((f) => f.id === c.id) ?? c : c));
    apply(`Timeline ${plan.params.weeks} → ${weeks} weeks`, { ...plan, params, cards }, { ...confirmed, weeks: true }, touched);
    if (weeks === 2) setFixedWeeks(true);
  };

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(history.slice(0, -1));
    setLocal(last.before);
    setConfirmed(last.confirmed);
    setChanged(affectedCards(last.before, "weeks"));
    setLog((l) => [...l, `Undo: ${last.label}`]);
    if (last.before.source === "visitor") setPlan(last.before);
  }, [history, setPlan]);

  useEffect(() => {
    if (fixedWeeks && log.some((l) => l.startsWith("Undo"))) complete();
  }, [fixedWeeks, log, complete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey && inView("stop-06")) {
        const t = e.target as HTMLElement;
        if (t.closest("input[type=text], textarea")) return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  return (
    <div className="s06">
      <div className="s06-panel">
        <p className="s06-head">
          What the agent understood
          {plan.source === "sample" && <span className="muted"> · sample plan. Build your own at stop 04.</span>}
        </p>
        <Marker n={1}>
          <ul className="assumptions">
            {list.map((a, i) => {
              const conf = (
                <span className="conf">
                  <span className="conf-icon" aria-hidden="true">
                    {ICON[a.confidence]}
                  </span>
                  {a.confidence}
                </span>
              );
              return (
              <li key={a.key} className="assumption" data-confidence={a.confidence}>
                <div className="assumption-body">
                  <p className="assumption-line">
                    {i === 3 ? <Marker n={2} inline className="conf-wrap">{conf}</Marker> : conf}
                    <span>
                      <strong>{a.label}:</strong> {a.value}
                    </span>
                  </p>
                  <p className="muted assumption-why">{a.why}</p>
                  {a.key === "weeks" && (
                    <div className="confirm" role="group" aria-label="Correct the timeline">
                      {[1, 2, 3, 4, 6].map((w) => (
                        <button key={w} type="button" className="btn btn-small" aria-pressed={plan.params.weeks === w && !!confirmed.weeks} onClick={() => setWeeks(w)}>
                          {w} wk
                        </button>
                      ))}
                    </div>
                  )}
                  {a.key === "audience" && !confirmed.audience && (
                    <div className="confirm" role="group" aria-label={`Is the audience ${a.value}?`}>
                      <span className="muted">Right?</span>
                      <button type="button" className="btn btn-small" onClick={() => apply(`Confirmed audience`, plan, { ...confirmed, audience: true }, [])}>
                        Yes
                      </button>
                      <button type="button" className="btn btn-small btn-ghost" onClick={() => apply(`Rejected audience guess`, plan, { ...confirmed, audience: true }, [])}>
                        No
                      </button>
                    </div>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </Marker>
      </div>

      <ol className="plan-cards s06-cards" aria-live="polite">
        {plan.cards.map((c) => (
          <li key={c.id} className="plan-item" data-changed={changed.includes(c.id) || undefined}>
            <p className="plan-step">{c.dependsOn.includes("weeks") ? "Depends on timeline" : c.step}</p>
            <p className="plan-title">{plan.overrides[c.id] ?? c.title}</p>
            <p className="plan-detail">{c.detail}</p>
          </li>
        ))}
      </ol>

      <Marker n={3} className="s06-history">
        <div className="history">
          <button type="button" className="btn btn-small" onClick={undo} disabled={!history.length}>
            Undo <kbd>⌘/Ctrl Z</kbd>
          </button>
          <ol className="history-strip" aria-label="Change history">
            {log.length === 0 && <li className="muted">No changes yet.</li>}
            {log.slice(-4).map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ol>
        </div>
      </Marker>
    </div>
  );
}
