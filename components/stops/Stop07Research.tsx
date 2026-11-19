"use client";

import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { AI_RAW_EXTRA, AI_THEMES, participants, QUOTES, scorecard, ThemeSchema, toMarkdown, type Theme } from "@/lib/research";
import { Marker, useStop } from "../Stop";

const quote = (id: string) => QUOTES.find((q) => q.id === id)!;

function QuoteChip({ id, themes, onMove }: { id: string; themes: Theme[]; onMove: (q: string, t: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const q = quote(id);
  const current = themes.find((t) => t.quoteIds.includes(id));
  return (
    <li ref={setNodeRef} className="quote" data-dragging={isDragging || undefined} style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}>
      <button type="button" className="drag-handle" aria-label={`Drag quote ${q.id}`} {...listeners} {...attributes}>
        ⠿
      </button>
      <span className="quote-text">
        “{q.text}” <span className="muted">{q.who}</span>
      </span>
      <select aria-label={`Move quote ${q.id} to…`} className="move-to" data-note="2" value={current?.id ?? ""} onChange={(e) => onMove(id, e.target.value)}>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </li>
  );
}

function ThemeCol({ theme, children, onToggle, onMerge, onSplit, others }: { theme: Theme; children: React.ReactNode; onToggle: () => void; onMerge: (into: string) => void; onSplit: () => void; others: Theme[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: theme.id });
  const weak = participants(theme) < 2;
  return (
    <section ref={setNodeRef} className="theme-col" data-over={isOver || undefined} data-weak={weak || undefined} aria-label={theme.name}>
      <header>
        <p className="theme-name">{theme.name}</p>
        <p className="theme-meta">
          {theme.quoteIds.length} quotes · {participants(theme)} {participants(theme) === 1 ? "person" : "people"} ·{" "}
          <span className={theme.validated ? "" : "is-unvalidated"}>
            <span aria-hidden="true">{theme.validated ? "✓" : "?"}</span> {theme.validated ? "Validated" : "Unvalidated"}
          </span>
        </p>
      </header>
      <ul className="quotes">{children}</ul>
      <footer className="theme-actions">
        <button type="button" className="link-btn" onClick={onToggle}>
          {theme.validated ? "Mark unvalidated" : "Mark validated"}
        </button>
        {theme.quoteIds.length > 1 && (
          <button type="button" className="link-btn" onClick={onSplit}>
            Split
          </button>
        )}
        <select aria-label={`Merge ${theme.name} into…`} className="move-to" value="" onChange={(e) => e.target.value && onMerge(e.target.value)}>
          <option value="">Merge into…</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </footer>
    </section>
  );
}

export default function Stop07Research() {
  const { complete } = useStop();
  const ids = useMemo(() => new Set(QUOTES.map((q) => q.id)), []);
  // The AI's raw output goes through the schema. Themes citing invented quotes are rejected.
  const [themes, setThemes] = useState<Theme[]>(() => [...AI_THEMES, AI_RAW_EXTRA].filter((t) => ThemeSchema(ids).safeParse(t).success));
  const rejected = [AI_RAW_EXTRA].filter((t) => !ThemeSchema(ids).safeParse(t).success);
  const [exported, setExported] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));
  const score = scorecard(themes);

  useEffect(() => {
    if (score.honest) complete();
  }, [score.honest, complete]);

  const move = (qid: string, tid: string) =>
    setThemes((ts) => ts.map((t) => ({ ...t, quoteIds: t.id === tid ? [...t.quoteIds.filter((x) => x !== qid), qid] : t.quoteIds.filter((x) => x !== qid) })).filter((t) => t.quoteIds.length));

  const onDragEnd = (e: DragEndEvent) => e.over && move(String(e.active.id), String(e.over.id));

  const exportMd = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(themes));
      setExported(true);
    } catch {
      setExported(false);
    }
  };

  return (
    <div className="s07">
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Marker n={1} className="s07-board-wrap">
          <div className="s07-board">
            {themes.map((t) => (
              <ThemeCol
                key={t.id}
                theme={t}
                others={themes.filter((o) => o.id !== t.id)}
                onToggle={() => setThemes((ts) => ts.map((x) => (x.id === t.id ? { ...x, validated: !x.validated } : x)))}
                onMerge={(into) => setThemes((ts) => ts.filter((x) => x.id !== t.id).map((x) => (x.id === into ? { ...x, quoteIds: [...x.quoteIds, ...t.quoteIds] } : x)))}
                onSplit={() =>
                  setThemes((ts) => {
                    const last = t.quoteIds[t.quoteIds.length - 1]!;
                    const rest = ts.map((x) => (x.id === t.id ? { ...x, quoteIds: x.quoteIds.slice(0, -1) } : x));
                    return [...rest, { id: `t${Date.now()}`, name: `Split from “${t.name.slice(0, 24)}”`, quoteIds: [last], validated: false }];
                  })
                }
              >
                {t.quoteIds.map((q) => (
                  <QuoteChip key={q} id={q} themes={themes} onMove={move} />
                ))}
              </ThemeCol>
            ))}
          </div>
        </Marker>
      </DndContext>

      <Marker n={3} className="s07-score-wrap">
        <div className="scorecard" aria-live="polite">
          <dl>
            <div>
              <dt>Quote coverage</dt>
              <dd>{score.coverage}%</dd>
            </div>
            <div>
              <dt>Themes with 2+ people</dt>
              <dd>{score.evidence}%</dd>
            </div>
            <div>
              <dt>Overclaims</dt>
              <dd className={score.overclaims ? "is-bad" : "is-ok"}>
                <span aria-hidden="true">{score.overclaims ? "✕ " : "✓ "}</span>
                {score.overclaims}
              </dd>
            </div>
          </dl>
          {rejected.map((r) => (
            <p key={r.id} className="muted rejected">
              Rejected 1 AI theme, “{r.name}”: it cites {r.quoteIds.join(", ")}, which is not in the source.
            </p>
          ))}
          <button type="button" className="btn btn-small" onClick={exportMd}>
            {exported ? "Markdown copied" : "Copy as Markdown"}
          </button>
        </div>
      </Marker>
    </div>
  );
}
