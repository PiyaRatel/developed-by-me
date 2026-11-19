import { describe, expect, it } from "vitest";
import { AA, AAA, brandScale, contrast, nearestAccessible } from "@/lib/color";
import { checkCopy, readingGrade, SCRIPTED } from "@/lib/copy-rules";
import { review, transition } from "@/lib/governance";
import { affectedCards, assumptions, buildCards, makePlan, searchLibrary } from "@/lib/plan";
import { AI_RAW_EXTRA, AI_THEMES, QUOTES, scorecard, ThemeSchema } from "@/lib/research";
import { CopyOutput, UITreeOutput } from "@/lib/ai-schemas";
import { search_components, check_contrast } from "@/lib/mcp-tools.mjs";

describe("01 token guard", () => {
  it("measures contrast", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("snaps a failing brand colour to the nearest passing one", () => {
    const fixed = nearestAccessible("#c7ccff", "#ffffff");
    expect(contrast(fixed, "#ffffff")).toBeGreaterThanOrEqual(AA);
  });
  it("leaves passing colours alone", () => {
    expect(nearestAccessible("#3b4bdb", "#ffffff")).toBe("#3b4bdb");
  });
  it("derives a dark-mode value that passes on dark surfaces", () => {
    const { dark } = brandScale("#3b4bdb");
    expect(contrast(dark, "#0e0d0b")).toBeGreaterThanOrEqual(AA);
  });
  it("derives a high-contrast value from the brand that passes AAA on black", () => {
    for (const brand of ["#3b4bdb", "#db3b6b", "#1f8a4c", "#ffd23f"]) {
      const { hc } = brandScale(brand);
      expect(contrast(hc, "#000000")).toBeGreaterThanOrEqual(AAA);
    }
    // Different brands give different high-contrast colours, not one fixed yellow.
    expect(brandScale("#3b4bdb").hc).not.toBe(brandScale("#db3b6b").hc);
  });
});

describe("02 governance state machine", () => {
  it("allows draft → review → changes → draft → review → approved", () => {
    let s = transition("draft", { type: "submit" });
    s = transition(s, { type: "reject", reason: "focus" });
    s = transition(s, { type: "edit" });
    s = transition(s, { type: "submit" });
    expect(transition(s, { type: "approve" })).toBe("approved");
  });
  it("blocks illegal transitions", () => {
    expect(() => transition("draft", { type: "approve" })).toThrow();
  });
  it("puts the highest user impact first", () => {
    expect(review({ default: true, hover: true, docs: false, focus: false, disabled: true, tokens: true })[0]!.id).toBe("focus");
  });
});

describe("04/06 plan", () => {
  const p = makePlan({ goal: "Ship a portfolio case study", hoursPerWeek: 6, figmaMix: 40, weeks: 4, redirect: null });
  it("search_library returns real library items", () => {
    expect(searchLibrary("portfolio case study", 40).length).toBeGreaterThan(0);
  });
  it("only timeline cards depend on weeks", () => {
    expect(affectedCards(p, "weeks").sort()).toEqual(["schedule", "ship"]);
  });
  it("flags the unasked timeline as assumed", () => {
    expect(assumptions(p).find((a) => a.key === "weeks")!.confidence).toBe("assumed");
    expect(assumptions(p, { weeks: true }).find((a) => a.key === "weeks")!.confidence).toBe("understood");
  });
  it("recomputes card text from params", () => {
    expect(buildCards({ ...p.params, weeks: 2 }).find((c) => c.id === "schedule")!.title).toBe("2-week schedule");
  });
});

describe("05 copy rules", () => {
  it("catches the exclamation mark in the chaotic run", () => {
    const hits = SCRIPTED.chaotic.flatMap(checkCopy);
    expect(hits.some((h) => h.rule === "No exclamation marks")).toBe(true);
  });
  it("passes every non-chaotic option", () => {
    for (const tone of ["formal", "friendly", "playful"] as const) expect(SCRIPTED[tone].flatMap(checkCopy)).toEqual([]);
  });
  it("scores reading level", () => {
    expect(readingGrade("Save your first project.")).toBeLessThan(8);
  });
  it("scripted runs satisfy the same schema as live runs", () => {
    for (const options of Object.values(SCRIPTED)) expect(CopyOutput.safeParse({ options }).success).toBe(true);
  });
});

describe("07 research", () => {
  const ids = new Set(QUOTES.map((q) => q.id));
  it("rejects themes that cite invented quotes", () => {
    expect(ThemeSchema(ids).safeParse(AI_RAW_EXTRA).success).toBe(false);
  });
  it("counts the weak theme as an overclaim until it is unvalidated", () => {
    expect(scorecard(AI_THEMES).overclaims).toBe(1);
    expect(scorecard(AI_THEMES.map((t) => (t.id === "t4" ? { ...t, validated: false } : t))).overclaims).toBe(0);
  });
});

describe("09 MCP tools", () => {
  it("finds registered components", () => {
    expect(search_components({ query: "empty state for a canceled subscription" }).map((c) => c.name)).toContain("EmptyState");
  });
  it("finds nothing for unregistered components", () => {
    expect(search_components({ query: "A neon carousel of featured plans" })).toEqual([]);
  });
  it("checks contrast", () => {
    expect(check_contrast({ fg: "#171612", bg: "#ecebe5" }).passesAA).toBe(true);
  });
  it("UI tree schema rejects unregistered components", () => {
    expect(UITreeOutput.safeParse({ status: "built", reason: "", nodes: [{ id: "a", parent: null, component: "Carousel", props: [] }] }).success).toBe(false);
  });
});
