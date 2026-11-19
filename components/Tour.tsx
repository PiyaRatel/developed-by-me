"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { FEATURED, pad, STOPS } from "@/lib/content";
import { Stop } from "./Stop";

const loading = () => <div className="stage-loading">Loading the stage…</div>;
// Short presentation cut: only the featured stops are loaded. The other stop
// components still live in ./stops and come back by adding them to FEATURED.
const STAGES: Record<number, ComponentType> = {
  1: dynamic(() => import("./stops/Stop01Tokens"), { loading }),
  5: dynamic(() => import("./stops/Stop05Copy"), { loading }),
};

const PROJECTS = FEATURED.map((f) => ({ ...f, meta: STOPS.find((s) => s.n === f.n)! }));

/** Page 0 is the home page; any other value is a featured stop number. */
const HOME = 0;

const hashFor = (n: number) => (n === HOME ? "" : `#stop-${pad(n)}`);

/** null for hashes that aren't pages, such as the skip link's #top. */
function pageFromHash(hash: string): number | null {
  if (hash === "") return HOME;
  const m = hash.match(/^#stop-(\d\d)$/);
  const n = m ? Number(m[1]) : NaN;
  return PROJECTS.some((p) => p.n === n) ? n : null;
}

export function Tour() {
  const [current, setCurrent] = useState(HOME);
  const currentRef = useRef(HOME);
  const shouldFocus = useRef(false);
  currentRef.current = current;

  const go = (n: number) => {
    if (n !== HOME && !PROJECTS.some((p) => p.n === n)) return;
    if (n !== currentRef.current) {
      history.pushState(null, "", `${location.pathname}${location.search}${hashFor(n)}`);
    }
    currentRef.current = n;
    shouldFocus.current = true;
    setCurrent(n);
  };

  /** Order: home, then each featured stop, then back home. */
  const order = [HOME, ...PROJECTS.map((p) => p.n)];
  const step = (dir: 1 | -1) => {
    const i = order.indexOf(currentRef.current);
    const next = order[i + dir];
    go(next ?? HOME);
  };

  // New page: start at the top and move focus to its heading.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    const id = current === HOME ? "intro-title" : `stop-${pad(current)}-title`;
    document.getElementById(id)?.focus({ preventScroll: true });
  }, [current]);

  // Deep link on first load (#stop-05) and browser back / forward.
  useEffect(() => {
    const sync = () => {
      const n = pageFromHash(location.hash);
      if (n !== null) setCurrent(n);
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  // ← → move between pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const typing = t.closest("textarea, select, [contenteditable='true']") || (t instanceof HTMLInputElement && !["checkbox", "radio", "range", "button", "submit"].includes(t.type));
      if (typing) return;
      const ownsArrows = t instanceof HTMLInputElement && (t.type === "range" || t.type === "radio");
      if (ownsArrows) return;
      if (e.key === "ArrowRight" && currentRef.current !== order[order.length - 1]) {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" && currentRef.current !== HOME) {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <a className="skip-link" href="#top">
        Skip to content
      </a>

      <main id="top" className="tour-short">
        <section className="intro" aria-labelledby="intro-title" hidden={current !== HOME}>
          <h1 id="intro-title" className="display intro-title" tabIndex={-1}>
            Developed by Me
          </h1>
          <ol className="projects">
            {PROJECTS.map(({ n, tag, meta }) => (
              <li key={n}>
                <a
                  href={`#stop-${pad(n)}`}
                  className="project-card"
                  onClick={(e) => {
                    e.preventDefault();
                    go(n);
                  }}
                >
                  <span className="stop-meta">
                    <span className="stop-num">{pad(n)}</span>
                    <span className="stop-cat">{tag}</span>
                  </span>
                  <span className="project-title">{meta.title}</span>
                  <span className="project-claim">{meta.claim}</span>
                </a>
              </li>
            ))}
          </ol>
          <p>
            <Link href="/design-system" className="btn">
              Design System <span aria-hidden="true">↗</span>
              <span className="sr-only">: tokens, components and writing rules, on a separate page</span>
            </Link>
          </p>
        </section>

        {PROJECTS.map(({ n, tag, meta }, i) => (
          <Stop
            key={n}
            meta={meta}
            tag={tag}
            Stage={STAGES[n]!}
            hidden={current !== n}
            prevLabel={i === 0 ? "Home" : "Previous"}
            nextLabel={i === PROJECTS.length - 1 ? "Back to home" : "Next"}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
        ))}
      </main>
    </>
  );
}
