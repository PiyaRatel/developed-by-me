"use client";

import { useRef, useState } from "react";
import { runAI } from "@/lib/ai-client";
import { MAX_INPUT, type UINodeT, type UITreeT } from "@/lib/ai-schemas";
import { check_contrast, get_tokens, get_usage_rules, registryData, search_components } from "@/lib/mcp-tools.mjs";
import { Marker, ScriptedBadge, useStop } from "../Stop";

type Call = { name: string; args: string; result: string };

const PRESETS = ["An empty state for a canceled subscription", "A neon carousel of featured plans"];

/** The recorded run: what the copilot composed from the tool results. */
function scriptedTree(request: string, found: string[]): UITreeT {
  if (!found.includes("EmptyState")) {
    const wanted = request.match(/carousel|slider|marquee|video|map|chart|table|modal|neon/i)?.[0] ?? "that";
    return {
      status: "refused",
      reason: `There's no “${wanted}” component in your system, so I won't invent one. I can build this with EmptyState, Button, Badge, Text or Stack, or you can propose a new component through stop 02.`,
      nodes: [],
    };
  }
  const canceled = /cancel/i.test(request);
  const p = (name: string, value: string) => ({ name, value });
  return {
    status: "built",
    reason: "Built from 4 registered components. 1 primary button, per the rules.",
    nodes: [
      { id: "n1", parent: null, component: "Stack", props: [p("gap", "space-4")] },
      { id: "n2", parent: "n1", component: "Badge", props: [p("label", canceled ? "Canceled" : "Empty"), p("tone", "neutral")] },
      { id: "n3", parent: "n1", component: "EmptyState", props: [p("title", canceled ? "Your plan is paused" : "Nothing here yet"), p("body", canceled ? "Your projects are safe until 30 June. Restart any time to pick up where you left off." : "Items you add will show up here."), p("icon", canceled ? "pause" : "inbox")] },
      { id: "n4", parent: "n3", component: "Button", props: [p("label", canceled ? "Restart plan" : "Add an item"), p("variant", "primary")] },
      { id: "n5", parent: "n3", component: "Button", props: [p("label", "See plans"), p("variant", "secondary")] },
    ],
  };
}

/** Usage rules are checked in code after the model answers. */
function ruleCheck(nodes: UINodeT[]): string[] {
  const problems: string[] = [];
  for (const es of nodes.filter((n) => n.component === "EmptyState")) {
    const primaries = nodes.filter((n) => n.parent === es.id && n.component === "Button" && n.props.some((p) => p.name === "variant" && p.value === "primary"));
    if (primaries.length !== 1) problems.push("An EmptyState needs exactly one primary Button.");
  }
  return problems;
}

const prop = (n: UINodeT, name: string) => n.props.find((p) => p.name === name)?.value ?? "";

function Render({ node, nodes, inspect }: { node: UINodeT; nodes: UINodeT[]; inspect: boolean }) {
  const kids = nodes.filter((n) => n.parent === node.id).map((k) => <Render key={k.id} node={k} nodes={nodes} inspect={inspect} />);
  const tokens = registryData.components.find((c) => c.name === node.component)?.tokens ?? [];
  const tag = inspect ? (
    <span className="inspect-tag" aria-hidden="true">
      {node.component} · {tokens.slice(0, 2).join(", ")}
    </span>
  ) : null;
  switch (node.component) {
    case "Stack":
      return (
        <div className="ui-stack" data-inspect={inspect || undefined}>
          {tag}
          {kids}
        </div>
      );
    case "Badge":
      return (
        <span className="ui-badge" data-inspect={inspect || undefined}>
          {tag}
          <span aria-hidden="true">⏸</span> {prop(node, "label")}
        </span>
      );
    case "EmptyState":
      return (
        <div className="empty-state ui-empty" data-inspect={inspect || undefined}>
          {tag}
          <span className="empty-icon" aria-hidden="true">
            {prop(node, "icon") === "pause" ? "⏸" : "◌"}
          </span>
          <p className="empty-title">{prop(node, "title")}</p>
          <p className="empty-body">{prop(node, "body")}</p>
          <div className="ui-actions">{kids}</div>
        </div>
      );
    case "Button":
      return (
        <span className={`demo-btn ${prop(node, "variant") === "secondary" ? "is-secondary" : ""}`} data-inspect={inspect || undefined}>
          {tag}
          {prop(node, "label")}
        </span>
      );
    default:
      return (
        <p className="ui-text" data-inspect={inspect || undefined}>
          {tag}
          {prop(node, "text")}
        </p>
      );
  }
}

export default function Stop09MCP() {
  const { complete } = useStop();
  const [request, setRequest] = useState(PRESETS[0]!);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tree, setTree] = useState<UITreeT | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [scripted, setScripted] = useState(false);
  const seen = useRef({ built: false, refused: false });

  const run = async (text: string) => {
    setBusy(true);
    setCalls([]);
    setTree(null);
    setDecision(null);
    const wait = () => new Promise((r) => window.setTimeout(r, 380));
    const log = (c: Call) => setCalls((cs) => [...cs, c]);

    const found = search_components({ query: text });
    await wait();
    log({ name: "search_components", args: `{ query: "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}" }`, result: found.length ? found.map((f) => f.name).join(", ") : "[] no matches" });
    const names = found.map((f) => f.name);
    if (names.includes("EmptyState")) {
      await wait();
      log({ name: "get_tokens", args: '{ component: "EmptyState" }', result: get_tokens({ component: "EmptyState" }).map((t) => t.token).join(", ") });
      await wait();
      log({ name: "get_usage_rules", args: "{}", result: `${get_usage_rules().length} rules` });
      await wait();
      const c = check_contrast({ fg: "#171612", bg: "#ecebe5" });
      log({ name: "check_contrast", args: '{ fg: "color-text", bg: "color-surface-2" }', result: `${c.ratio}:1 ${c.passesAA ? "passes" : "fails"}` });
    }
    const res = await runAI("ui-tree", { request: text }, () => scriptedTree(text, names));
    setScripted(res.scripted);
    setTree(res.data);
    setProblems(res.data.status === "built" ? ruleCheck(res.data.nodes) : []);
    seen.current[res.data.status] = true;
    if (seen.current.built && seen.current.refused) complete();
    setBusy(false);
  };

  const root = tree?.nodes.find((n) => n.parent === null);

  return (
    <div className="s09">
      <form
        className="s09-ask"
        onSubmit={(e) => {
          e.preventDefault();
          void run(request);
        }}
      >
        <label className="field">
          <span>Ask the copilot for a screen</span>
          <input value={request} maxLength={MAX_INPUT} onChange={(e) => setRequest(e.target.value)} />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Working…" : "Build it"}
        </button>
        <div className="presets" role="group" aria-label="Example requests">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => {
                setRequest(p);
                void run(p);
              }}
              disabled={busy}
            >
              {p.includes("neon") ? "Try: neon carousel" : "Try: canceled subscription"}
            </button>
          ))}
        </div>
      </form>

      <Marker n={1} className="s09-log-wrap">
        <ol className="tool-log" aria-label="Tool calls" aria-live="polite">
          {calls.length === 0 && <li className="muted">Tool calls appear here as they happen.</li>}
          {calls.map((c, i) => (
            <li key={i}>
              <code>
                <span className="tool-name">{c.name}</span>
                {c.args}
              </code>
              <span className="tool-result">→ {c.result}</span>
            </li>
          ))}
        </ol>
        <ScriptedBadge show={scripted} />
      </Marker>

      <div className="s09-out">
        {tree?.status === "refused" && (
          <p className="refusal" role="status">
            <span aria-hidden="true">✋</span> {tree.reason}
          </p>
        )}
        {tree?.status === "built" && root && (
          <>
            <div className="s09-canvas">
              <Render node={root} nodes={tree.nodes} inspect={inspect} />
            </div>
            {problems.map((p) => (
              <p key={p} className="rule-msg">
                {p}
              </p>
            ))}
            <div className="s09-actions">
              <Marker n={2}>
                <label className="switch">
                  <input type="checkbox" checked={inspect} onChange={(e) => setInspect(e.target.checked)} />
                  Inspect
                </label>
              </Marker>
              <Marker n={3}>
                <span className="approve">
                  <button type="button" className="btn btn-small btn-primary" onClick={() => setDecision("approved")} aria-pressed={decision === "approved"}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setDecision("rejected")} aria-pressed={decision === "rejected"}>
                    Reject
                  </button>
                </span>
              </Marker>
              {decision && <span className="muted">{decision === "approved" ? "Saved to drafts. (Demo: nothing left the page.)" : "Discarded. Nothing was saved."}</span>}
            </div>
          </>
        )}
        {!tree && !busy && <p className="muted">Ask for something the system can build, then something it can't.</p>}
      </div>
    </div>
  );
}
