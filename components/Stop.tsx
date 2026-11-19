"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { pad, SITE, type StopMeta } from "@/lib/content";
import { useStore } from "@/lib/store";

type StopCtx = { n: number; active: number | null; complete: () => void; done: boolean };
const Ctx = createContext<StopCtx>({ n: 0, active: null, complete: () => {}, done: false });
export const useStop = () => useContext(Ctx);

/** Numbered marker on the stage. Lights up when its design note is hovered or focused. */
export function Marker({ n, children, className = "", inline = false }: { n: number; children: ReactNode; className?: string; inline?: boolean }) {
  const { active } = useStop();
  // Use `inline` inside phrasing content (<p>, <span>) so the HTML stays valid.
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={`marker-wrap ${inline ? "is-inline" : ""} ${className}`} data-on={active === n ? "true" : undefined}>
      <span className="marker" aria-hidden="true">
        {n}
      </span>
      {children}
    </Tag>
  );
}

/** Small badge shown when an AI stop played its recorded run. */
export function ScriptedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="badge badge-scripted" title="The live API was slow or unavailable, so a recorded run played instead.">
      <span aria-hidden="true">●</span> Scripted run
    </span>
  );
}

function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (!("IntersectionObserver" in window)) return setNear(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near] as const;
}

type StopProps = {
  meta: StopMeta;
  Stage: React.ComponentType;
  hidden?: boolean;
  tag?: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
};

export function Stop({ meta, Stage, hidden, tag, prevLabel, nextLabel, onPrev, onNext }: StopProps) {
  const { stamps, stamp, justStamped } = useStore();
  const [active, setActive] = useState<number | null>(null);
  const [ref, near] = useNearViewport<HTMLElement>();
  const done = stamps.includes(meta.n);
  const complete = useCallback(() => stamp(meta.n), [stamp, meta.n]);
  const id = `stop-${pad(meta.n)}`;

  return (
    <Ctx.Provider value={{ n: meta.n, active, complete, done }}>
      <section ref={ref} id={id} className="stop" aria-labelledby={`${id}-title`} hidden={hidden} data-stop={meta.n}>
        <div className={`stop-grid ${meta.notes.length ? "" : "is-top"}`}>
          <div className="stop-concept">
            <p className="stop-meta">
              <span className="stop-num">{pad(meta.n)}</span>
              <span className="stop-cat">{tag ?? meta.category}</span>
              <span className="time-badge">
                <span className="sr-only">About </span>
                {meta.seconds} s
              </span>
            </p>
            <h2 id={`${id}-title`} className="display" tabIndex={-1}>
              {meta.title}
            </h2>
            <p className="claim">{meta.claim}</p>
            <details className="deeper">
              <summary>
                Go deeper <span aria-hidden="true" className="deeper-plus">+</span>
              </summary>
              <ul>
                {meta.deeper.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>
          </div>

          <div className="stop-work">
            <p className="dare">
              <span className="dare-label">Dare</span>
              <span className="dare-text">“{meta.dare}”</span>
            </p>
            <div className="stage" data-active-note={active ?? undefined}>
              {near ? <Stage /> : <div className="stage-loading">Loading the stage…</div>}
            </div>
            {meta.notes.length > 0 && (
              <ol className="notes" aria-label="Design notes">
                {meta.notes.map((note, i) => (
                  <li key={note}>
                    <button
                      type="button"
                      className="note"
                      aria-pressed={active === i + 1}
                      onMouseEnter={() => setActive(i + 1)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i + 1)}
                      onBlur={() => setActive(null)}
                    >
                      <span className="note-num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>{note}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <footer className="stop-foot">
          <ul className="tech" aria-label="Built with">
            <li className="tech-label" aria-hidden="true">
              Built with
            </li>
            {meta.tech.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
            <li>
              <a className="source-link" href={`${SITE.repo}/blob/main/${meta.source}`} target="_blank" rel="noreferrer">
                Source<span className="sr-only"> for stop {pad(meta.n)} (opens in a new tab)</span>
              </a>
            </li>
            {meta.sourceNote && (
              <li>
                <a className="source-link" href={meta.sourceNote.href} target="_blank" rel="noreferrer">
                  {meta.sourceNote.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            )}
          </ul>
          <div className="foot-actions">
            <span className={`stamp-mini ${done ? "is-done" : ""} ${justStamped === meta.n ? "is-pressing" : ""}`}>
              <span aria-hidden="true" className="stamp-ink">
                {done ? "✓" : pad(meta.n)}
              </span>
              <span>
                {done ? "Stamped: " : "Stamp: "}
                <strong>{meta.stamp}</strong>
              </span>
            </span>
            <button type="button" className="btn btn-ghost" onClick={onPrev}>
              <span aria-hidden="true">←</span> {prevLabel}
            </button>
            <button type="button" className="btn btn-primary" onClick={onNext}>
              {nextLabel} <span aria-hidden="true">→</span>
            </button>
          </div>
        </footer>
      </section>
    </Ctx.Provider>
  );
}
