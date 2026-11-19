"use client";

import { useState } from "react";
import { CRITERIA, review, transition, type Criterion, type Status } from "@/lib/governance";
import { Marker, useStop } from "../Stop";

const TRACK: { id: Status; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "approved", label: "Approved" },
];

const START: Record<string, boolean> = { default: true, hover: true, focus: false, disabled: true, docs: true, tokens: true };

export default function Stop02Governance() {
  const { complete } = useStop();
  const [status, setStatus] = useState<Status>("draft");
  const [checked, setChecked] = useState(START);
  const [finding, setFinding] = useState<Criterion | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [health, setHealth] = useState(72);

  const submit = () => {
    const inReview = transition(status === "changes" ? "draft" : status, { type: "submit" });
    setStatus(inReview);
    setReviewing(true);
    window.setTimeout(() => {
      const failing = review(checked);
      setReviewing(false);
      if (failing.length) {
        setFinding(failing[0]!);
        setStatus(transition(inReview, { type: "reject", reason: failing[0]!.id }));
      } else {
        setFinding(null);
        setStatus(transition(inReview, { type: "approve" }));
        setHealth(81);
        complete();
      }
    }, 700);
  };

  const toggle = (id: string) => {
    if (status === "approved" || reviewing) return;
    setChecked((c) => ({ ...c, [id]: !c[id] }));
    if (status === "changes") setStatus(transition("changes", { type: "edit" }));
  };

  const stepIndex = status === "approved" ? 2 : status === "review" || status === "changes" ? 1 : 0;

  return (
    <div className="s02">
      <Marker n={1} className="s02-track">
        <ol className="track" aria-label="Status">
          {TRACK.map((t, i) => (
            <li key={t.id} data-state={i < stepIndex ? "done" : i === stepIndex ? "now" : "todo"} aria-current={i === stepIndex ? "step" : undefined}>
              {i === 1 && status === "changes" ? "Changes requested" : t.label}
            </li>
          ))}
        </ol>
      </Marker>

      <div className="s02-form">
        <p className="s02-component">
          <span className="chip-demo" tabIndex={-1}>
            Filter: Recent
          </span>
          <span>
            <strong>Chip</strong> v0.1 · contributed by you
          </span>
        </p>
        <fieldset>
          <legend>Contribution checklist</legend>
          <ul className="checklist">
            {CRITERIA.map((c) => (
              <li key={c.id}>
                <label>
                  <input type="checkbox" checked={!!checked[c.id]} onChange={() => toggle(c.id)} disabled={status === "approved"} />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={reviewing || status === "approved"}>
          {status === "approved" ? "Approved" : status === "changes" || status === "draft" ? (finding ? "Resubmit for review" : "Submit for review") : "Reviewing…"}
        </button>
      </div>

      <div className="s02-review" aria-live="polite">
        <Marker n={2}>
          <div className="reviewer">
            <p className="reviewer-name">
              <span aria-hidden="true">◆</span> System reviewer
            </p>
            {reviewing && <p>Running 6 checks…</p>}
            {!reviewing && finding && (
              <>
                <p className="severity">
                  <span aria-hidden="true">▲</span> Severity: {finding.severity}
                </p>
                <p>{finding.explain}</p>
                <p className="muted">The check ran in code. The AI only wrote this explanation.</p>
              </>
            )}
            {!reviewing && status === "approved" && (
              <p>
                <span aria-hidden="true">✓</span> All 6 checks pass. Chip ships in v2.4.0 as a minor release.
              </p>
            )}
            {!reviewing && status === "draft" && !finding && <p className="muted">Submit the component to get a review.</p>}
          </div>
        </Marker>
        <Marker n={3}>
          <div className="health">
            <p className="health-num">
              <span className="health-score">{health}</span>
              <span className="sr-only"> out of 100</span> system health
            </p>
            <dl className="health-dl">
              <div>
                <dt>Adoption</dt>
                <dd>{health > 72 ? "64%" : "61%"}</dd>
              </div>
              <div>
                <dt>Detach rate</dt>
                <dd>{health > 72 ? "7%" : "9%"}</dd>
              </div>
              <div>
                <dt>Docs coverage</dt>
                <dd>{health > 72 ? "92%" : "88%"}</dd>
              </div>
            </dl>
          </div>
        </Marker>
      </div>
    </div>
  );
}
