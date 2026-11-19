// The plan built at stop 04, reused at stops 06 and 10.
// Cards are derived from params, and each card declares which params it depends on,
// so stop 06 can recompute only the affected cards when an assumption changes.

export type PlanParams = {
  goal: string;
  hoursPerWeek: number; // clarifying question 1
  figmaMix: number; // clarifying question 2: 0 = all code, 100 = all Figma
  weeks: number; // never asked. The agent assumes it.
  redirect: string | null;
};

export type ParamKey = keyof PlanParams;

export type Card = {
  id: string;
  step: string;
  title: string;
  detail: string;
  dependsOn: ParamKey[];
  tool?: { name: string; result: string };
};

export type Plan = {
  params: PlanParams;
  cards: Card[];
  overrides: Record<string, string>; // per-card edits
  variants: Record<string, number>; // per-card regenerate count
  approved: boolean;
  source: "visitor" | "sample";
};

export const DEFAULT_GOAL = "Ship a portfolio case study for my design system";

export const LIBRARY = [
  { id: "lib-01", title: "Case-study page template", kind: "figma", tags: ["portfolio", "case", "study", "page"] },
  { id: "lib-02", title: "Token starter (DTCG)", kind: "code", tags: ["token", "design", "system", "theme"] },
  { id: "lib-03", title: "Component audit sheet", kind: "figma", tags: ["audit", "component", "system", "design"] },
  { id: "lib-04", title: "Storybook docs recipe", kind: "code", tags: ["docs", "component", "system", "storybook"] },
  { id: "lib-05", title: "Interview synthesis board", kind: "figma", tags: ["research", "interview", "case", "study"] },
  { id: "lib-06", title: "Next.js portfolio shell", kind: "code", tags: ["portfolio", "site", "ship", "page"] },
] as const;

/** A real, deterministic tool. The agent calls it at the "Search library" step. */
export function searchLibrary(query: string, figmaMix: number) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const preferred = figmaMix >= 50 ? "figma" : "code";
  return LIBRARY.map((item) => ({
    item,
    score: item.tags.filter((t) => words.some((w) => t.startsWith(w) || w.startsWith(t))).length + (item.kind === preferred ? 0.5 : 0),
  }))
    .filter((r) => r.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((r) => r.item);
}

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length] as T;

export function buildCards(p: PlanParams, variants: Record<string, number> = {}): Card[] {
  const figmaDays = Math.round((p.figmaMix / 100) * 5);
  const codeDays = 5 - figmaDays;
  const total = p.hoursPerWeek * p.weeks;
  const hits = searchLibrary(p.goal, p.figmaMix);
  const v = (id: string) => variants[id] ?? 0;
  return [
    {
      id: "audit",
      step: "Search library",
      title: "Start from what exists",
      detail: hits.length
        ? `Reuse ${hits.map((h) => h.title).join(" and ")} instead of starting blank.`
        : "Nothing in the library matches yet, so start with a blank brief.",
      dependsOn: ["goal", "figmaMix"],
      tool: { name: "search_library", result: hits.map((h) => h.id).join(", ") || "no matches" },
    },
    {
      id: "design",
      step: "Draft",
      title: pick(["Design pass in Figma", "Shape it in Figma first", "Figma: structure and states"], v("design")),
      detail: `${figmaDays} of every 5 working sessions in Figma${p.redirect === "more Figma" ? ", with variables and modes set up before any layout" : ""}.`,
      dependsOn: ["figmaMix", "redirect"],
    },
    {
      id: "build",
      step: "Draft",
      title: pick(["Build it in code", "Ship the real thing", "Code: tokens, then pages"], v("build")),
      detail: `${codeDays} of every 5 sessions in code, about ${Math.round(p.hoursPerWeek * (codeDays / 5))} h a week.`,
      dependsOn: ["figmaMix", "hoursPerWeek"],
    },
    {
      id: "schedule",
      step: "Schedule",
      title: `${p.weeks}-week schedule`,
      detail: `${total} hours in total. ${p.weeks <= 2 ? "Cut to one hero flow and one component deep-dive." : "Room for two flows, a component deep-dive and a write-up."}`,
      dependsOn: ["weeks", "hoursPerWeek"],
    },
    {
      id: "ship",
      step: "Review",
      title: "Review, then ship",
      detail: `Peer review in week ${Math.max(1, p.weeks - 1)}, publish by the end of week ${p.weeks}.`,
      dependsOn: ["weeks"],
    },
  ];
}

export function makePlan(params: PlanParams, source: Plan["source"] = "visitor"): Plan {
  return { params, cards: buildCards(params), overrides: {}, variants: {}, approved: false, source };
}

export const SAMPLE_PLAN: Plan = {
  ...makePlan({ goal: DEFAULT_GOAL, hoursPerWeek: 6, figmaMix: 40, weeks: 4, redirect: null }, "sample"),
  approved: true,
};

/** Which cards change when one param changes. Used to animate only the affected cards. */
export function affectedCards(plan: Plan, key: ParamKey): string[] {
  return plan.cards.filter((c) => c.dependsOn.includes(key)).map((c) => c.id);
}

export type Confidence = "understood" | "unsure" | "assumed";

export type Assumption = { key: ParamKey | "audience"; label: string; value: string; confidence: Confidence; why: string };

/** Confidence comes from rules in code, never from the model's self-score. */
export function assumptions(plan: Plan, explicitlySet: Partial<Record<ParamKey, boolean>> = {}): Assumption[] {
  const p = plan.params;
  const goalSaysWeeks = /\b\d+\s*weeks?\b/i.test(p.goal);
  const mentionsPortfolio = /portfolio|case study/i.test(p.goal);
  return [
    { key: "goal", label: "Goal", value: p.goal, confidence: "understood", why: "You typed it." },
    { key: "hoursPerWeek", label: "Hours a week", value: `${p.hoursPerWeek} h`, confidence: "understood", why: "You answered the slider." },
    {
      key: "audience",
      label: "Audience",
      value: mentionsPortfolio ? "Hiring managers" : "Your team",
      confidence: "unsure",
      why: mentionsPortfolio ? "Inferred from the word “portfolio”." : "No audience given. A guess from the goal.",
    },
    {
      key: "weeks",
      label: "Timeline",
      value: `${p.weeks} weeks`,
      confidence: explicitlySet.weeks || goalSaysWeeks ? "understood" : "assumed",
      why: explicitlySet.weeks ? "You confirmed it." : goalSaysWeeks ? "Your goal names a timeline." : "Nobody asked. The agent filled in a default.",
    },
  ];
}
