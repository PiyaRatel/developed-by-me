"use client";

import { useState, type ReactNode } from "react";
import { runAI } from "@/lib/ai-client";
import type { CopyOptionT } from "@/lib/ai-schemas";
import { assemblePrompt, checkCopy, LIMITS, readingGrade, SCRIPTED, TONES, type Violation } from "@/lib/copy-rules";
import { useStore } from "@/lib/store";
import { Marker, ScriptedBadge, useStop } from "../Stop";

function highlight(text: string, vs: Violation[]): ReactNode {
  const v = vs.find((x) => text.includes(x.match));
  if (!v) return text;
  const i = text.indexOf(v.match);
  return (
    <>
      {text.slice(0, i)}
      <mark className="rule-hit">{v.match}</mark>
      {text.slice(i + v.match.length)}
    </>
  );
}

export default function Stop05Copy() {
  const { setSavedCopy, savedCopy } = useStore();
  const { complete } = useStop();
  const [toneIdx, setToneIdx] = useState(1);
  const [options, setOptions] = useState<CopyOptionT[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [scripted, setScripted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const tone = TONES[toneIdx]!;

  const generate = async () => {
    setBusy(true);
    const res = await runAI("copy", { tone }, () => ({ options: SCRIPTED[tone] }));
    setOptions(res.data.options);
    setScripted(res.scripted);
    setBusy(false);
    if (res.data.options.some((o) => checkCopy(o).length > 0)) complete();
  };

  return (
    <div className="s05">
      <div className="s05-controls">
        <label className="field">
          <span>
            Tone · <strong>{tone}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={3}
            value={toneIdx}
            aria-valuetext={tone}
            onChange={(e) => {
              setToneIdx(Number(e.target.value));
              setOptions(null);
            }}
          />
          <span className="range-scale" aria-hidden="true">
            <span>formal</span>
            <span>friendly</span>
            <span>playful</span>
            <span>chaotic</span>
          </span>
        </label>
        <div className="s05-btns">
          <button type="button" className="btn btn-primary" onClick={generate} disabled={busy}>
            {busy ? "Writing…" : "Write 3 options"}
          </button>
          <Marker n={1}>
            <label className="switch">
              <input type="checkbox" checked={showPrompt} onChange={(e) => setShowPrompt(e.target.checked)} />
              Show prompt
            </label>
          </Marker>
          <ScriptedBadge show={scripted} />
        </div>
      </div>

      {showPrompt ? (
        <pre className="prompt-view" tabIndex={0} aria-label="Assembled prompt">
          {assemblePrompt(tone)}
        </pre>
      ) : (
        <ul className="copy-options" aria-live="polite">
          {(options ?? []).map((o, i) => {
            const vs = checkCopy(o);
            const grade = readingGrade(`${o.title}. ${o.body}`);
            return (
              <li key={i} className={`copy-opt ${vs.length ? "has-hit" : ""}`}>
                <div className="empty-state">
                  <span className="empty-icon" aria-hidden="true">
                    ◌
                  </span>
                  <p className="empty-title">{highlight(o.title, vs.filter((v) => v.slot === "title"))}</p>
                  <p className="empty-body">{highlight(o.body, vs.filter((v) => v.slot === "body"))}</p>
                  <span className="demo-btn">{highlight(o.cta, vs.filter((v) => v.slot === "cta"))}</span>
                </div>
                <div className="copy-meta">
                  <Marker n={2}>
                    <span className="mono">
                      {o.title.length}/{LIMITS.title} · {o.body.length}/{LIMITS.body} · {o.cta.length}/{LIMITS.cta}
                    </span>
                  </Marker>
                  <Marker n={3}>
                    <span className="mono">Grade {grade}</span>
                  </Marker>
                </div>
                {vs.length ? (
                  <p className="rule-msg">
                    <span aria-hidden="true">✕</span> Caught: {vs[0]!.rule}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn btn-small"
                    aria-pressed={savedCopy?.title === o.title}
                    onClick={() => setSavedCopy(o)}
                  >
                    {savedCopy?.title === o.title ? "Saved for your card" : "Save this one"}
                  </button>
                )}
              </li>
            );
          })}
          {!options && (
            <li className="copy-empty muted">
              {toneIdx < 3 ? "Push the tone all the way to “chaotic”, then write options." : "Now write options and watch the rule checker."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
