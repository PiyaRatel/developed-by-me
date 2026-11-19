// Stop 02: a typed state machine for a contribution's status.
export type Status = "draft" | "review" | "changes" | "approved";
export type Event = { type: "submit" } | { type: "reject"; reason: string } | { type: "approve" } | { type: "edit" };

export const TRANSITIONS: Record<Status, Partial<Record<Event["type"], Status>>> = {
  draft: { submit: "review", edit: "draft" },
  review: { reject: "changes", approve: "approved" },
  changes: { edit: "draft", submit: "review" },
  approved: {},
};

export function transition(s: Status, e: Event): Status {
  const next = TRANSITIONS[s][e.type];
  if (!next) throw new Error(`Illegal transition ${s} --${e.type}-->`);
  return next;
}

export type Criterion = { id: string; label: string; severity: "blocks keyboard users" | "confuses some users" | "cosmetic"; explain: string };

export const CRITERIA: Criterion[] = [
  { id: "default", label: "Default state", severity: "cosmetic", explain: "" },
  { id: "hover", label: "Hover state", severity: "cosmetic", explain: "" },
  { id: "focus", label: "Focus state", severity: "blocks keyboard users", explain: "Missing focus state. Keyboard users can't see where they are, so they get lost on any page that uses this chip." },
  { id: "disabled", label: "Disabled state", severity: "confuses some users", explain: "No disabled state. People will tap a chip that does nothing and not know why." },
  { id: "docs", label: "Usage docs", severity: "confuses some users", explain: "No usage docs. Teams will guess when to use Chip versus Badge." },
  { id: "tokens", label: "Uses tokens only", severity: "cosmetic", explain: "Hard-coded colour found. It will not follow themes." },
];

/** Deterministic checks. Returns failing criteria ordered by user impact. */
export function review(checked: Record<string, boolean>): Criterion[] {
  const order = { "blocks keyboard users": 0, "confuses some users": 1, cosmetic: 2 } as const;
  return CRITERIA.filter((c) => !checked[c.id]).sort((a, b) => order[a.severity] - order[b.severity]);
}
