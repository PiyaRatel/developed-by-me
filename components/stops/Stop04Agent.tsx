"use client";

import { useEffect, useRef, useState } from "react";
import { runAI } from "@/lib/ai-client";
import { MAX_INPUT } from "@/lib/ai-schemas";
import { buildCards, DEFAULT_GOAL, type Card, type PlanParams } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { Marker, ScriptedBadge, useStop } from "../Stop";

type Phase = "goal" | "clarify" | "running" | "paused" | "review" | "approved";
const STEPS = ["Understand", "Search library", "Draft", "Schedule", "Review"];
const REDIRECTS = ["more Figma", "more code", "smaller scope"] as const;

export default function Stop04Agent() {
  const { plan: saved, setPlan, announce } = useStore();
  const { complete } = useStop();
  const [phase, setPhase] = useState<Phase>(saved?.source === "visitor" && saved.approved ? "approved" : "goal");
  const [params, setParams] = useState<PlanParams>(saved?.params ?? { goal: DEFAULT_GOAL, hoursPerWeek: 6, figmaMix: 40, weeks: 4, redirect: null });
  const [cards, setCards] = useState<Card[]>(saved?.source === "visitor" ? saved.cards : []);
  const [overrides, setOverrides] = useState<Record<string, string>>(saved?.overrides ?? {});
  const [variants, setVariants] = useState<Record<string, number>>(saved?.variants ?? {});
  const [editing, setEditing] = useState<string | null>(null);
  const [scripted, setScripted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const total = 5;
  const stepNow = phase === "review" || phase === "approved" ? 5 : cards.length === 0 ? 1 : Math.min(4, 1 + cards.length);

  // Stream one card per step. Each step is one small, schema-checked call.
  const stream = async (from: number) => {
    const ctrl = new AbortController();
    abort.current = ctrl;
    for (let i = from; i < total; i++) {
      await new Promise((r) => window.setTimeout(r, 850));
      if (ctrl.signal.aborted) return;
      const blueprint = buildCards(paramsRef.current)[i]!;
      try {
        const res = await runAI(
          "plan-card",
          { goal: paramsRef.current.goal, step: blueprint.step, baseline: blueprint.detail, redirect: paramsRef.current.redirect },
          () => ({ detail: blueprint.detail }),
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return;
        if (res.scripted) setScripted(true);
        setCards((c) => [...c, { ...blueprint, detail: res.data.detail }]);
        announce(`Card ${i + 1} of ${total}: ${blueprint.title}`);
      } catch {
        return; // aborted by Pause
      }
    }
    setPhase("review");
    announce("Plan drafted. Review the cards, then approve.");
  };

  useEffect(() => () => abort.current?.abort(), []);

  const start = () => {
    setCards([]);
    setPhase("running");
    void stream(0);
  };

  const pause = () => {
    abort.current?.abort();
    setPaused(true);
    setPhase("paused");
    announce("Agent paused. Nothing is lost.");
  };

  const redirect = (r: (typeof REDIRECTS)[number]) => {
    setRedirected(true);
    setParams((p) => ({
      ...p,
      redirect: r === "more Figma" ? "more Figma" : r === "more code" ? "more code" : "smaller scope",
      figmaMix: r === "more Figma" ? Math.max(p.figmaMix, 75) : r === "more code" ? Math.min(p.figmaMix, 25) : p.figmaMix,
      hoursPerWeek: r === "smaller scope" ? Math.max(2, p.hoursPerWeek - 2) : p.hoursPerWeek,
    }));
    setPhase("running");
    announce(`Redirected: ${r}. Continuing from card ${cards.length + 1}.`);
    window.setTimeout(() => void stream(cards.length), 0);
  };

  const approve = () => {
    const plan = { params, cards, overrides, variants, approved: true, source: "visitor" as const };
    setPlan(plan);
    setPhase("approved");
    announce("Plan approved and saved. It comes back at stops 06 and 10.");
    if (paused) complete();
  };

  const regenerate = (id: string) => {
    const v = { ...variants, [id]: (variants[id] ?? 0) + 1 };
    setVariants(v);
    const fresh = buildCards(params, v).find((c) => c.id === id)!;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, title: fresh.title } : c)));
    setOverrides(({ [id]: _drop, ...rest }) => rest);
  };

  return (
    <div className="s04">
      <Marker n={1} className="s04-rail-wrap">
        <ol className="step-rail" aria-label="Agent progress">
          {STEPS.map((s, i) => (
            <li key={s} data-state={phase === "goal" || phase === "clarify" ? "todo" : i < stepNow ? "done" : i === stepNow ? "now" : "todo"}>
              {s}
            </li>
          ))}
        </ol>
        <p className="muted s04-count">
          {phase === "goal" || phase === "clarify" ? "Waiting for you" : `${cards.length} of ${total} cards`}
          {phase === "paused" && " · paused"}
          <ScriptedBadge show={scripted} />
        </p>
      </Marker>

      {phase === "goal" && (
        <form
          className="s04-goal"
          onSubmit={(e) => {
            e.preventDefault();
            setPhase("clarify");
          }}
        >
          <label className="field">
            <span>What do you want to get done?</span>
            <input value={params.goal} maxLength={MAX_INPUT} onChange={(e) => setParams({ ...params, goal: e.target.value })} required />
          </label>
          <button className="btn btn-primary">Plan it</button>
        </form>
      )}

      {phase === "clarify" && (
        <form
          className="s04-clarify"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <p className="s04-q">Two quick questions before I start.</p>
          <label className="field">
            <span>How many hours a week? · {params.hoursPerWeek} h</span>
            <input type="range" min={2} max={20} value={params.hoursPerWeek} onChange={(e) => setParams({ ...params, hoursPerWeek: Number(e.target.value) })} />
          </label>
          <label className="field">
            <span>
              Figma or code? · {params.figmaMix}% Figma, {100 - params.figmaMix}% code
            </span>
            <input type="range" min={0} max={100} step={5} value={params.figmaMix} onChange={(e) => setParams({ ...params, figmaMix: Number(e.target.value) })} />
          </label>
          <button className="btn btn-primary">Start the agent</button>
        </form>
      )}

      {(phase === "running" || phase === "paused" || phase === "review" || phase === "approved") && (
        <>
          <Marker n={2} className="s04-controls">
            {phase === "running" && (
              <button type="button" className="btn btn-primary" onClick={pause}>
                <span aria-hidden="true">❚❚</span> Pause
              </button>
            )}
            {phase === "paused" && (
              <div className="redirect" role="group" aria-label="Redirect the agent">
                <span>Steer it:</span>
                {REDIRECTS.map((r) => (
                  <button key={r} type="button" className="btn btn-small" onClick={() => redirect(r)}>
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() => {
                    setPhase("running");
                    void stream(cards.length);
                  }}
                >
                  Resume as is
                </button>
              </div>
            )}
            {phase === "review" && (
              <>
                <button type="button" className="btn btn-primary" onClick={approve}>
                  Approve plan
                </button>
                {!paused && <span className="muted">Tip: the dare is to pause it. Start over and press Pause mid-stream.</span>}
                {!paused && (
                  <button type="button" className="btn btn-small btn-ghost" onClick={start}>
                    Start over
                  </button>
                )}
              </>
            )}
            {phase === "approved" && (
              <p className="ok-text">
                <span aria-hidden="true">✓</span> Approved and saved. {redirected || params.redirect ? `Steered to “${params.redirect}”. ` : ""}See it again at stops 06 and 10.{" "}
                <button type="button" className="link-btn" onClick={() => setPhase("goal")}>
                  Make a new plan
                </button>
              </p>
            )}
          </Marker>

          <Marker n={3} className="s04-cards-wrap">
            <ol className="plan-cards">
              {cards.map((c) => (
                <li key={c.id} className="plan-item">
                  <p className="plan-step">{c.step}</p>
                  {editing === c.id ? (
                    <input
                      className="plan-edit"
                      aria-label={`Edit title of ${c.title}`}
                      defaultValue={overrides[c.id] ?? c.title}
                      maxLength={60}
                      autoFocus
                      onBlur={(e) => {
                        setOverrides({ ...overrides, [c.id]: e.target.value });
                        setEditing(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <p className="plan-title">{overrides[c.id] ?? c.title}</p>
                  )}
                  <p className="plan-detail">{c.detail}</p>
                  {c.tool && (
                    <p className="tool-line">
                      <code>
                        {c.tool.name}() → {c.tool.result}
                      </code>
                    </p>
                  )}
                  {phase === "review" && (
                    <p className="plan-actions">
                      <button type="button" className="link-btn" onClick={() => setEditing(c.id)}>
                        Edit<span className="sr-only"> {c.title}</span>
                      </button>
                      <button type="button" className="link-btn" onClick={() => regenerate(c.id)}>
                        Regenerate<span className="sr-only"> {c.title}</span>
                      </button>
                    </p>
                  )}
                </li>
              ))}
              {phase === "running" && <li className="plan-item is-ghost" aria-hidden="true" />}
            </ol>
          </Marker>
        </>
      )}
    </div>
  );
}
