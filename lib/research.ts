// Stop 07 data. Themes must cite real quote ids. Anything else is rejected.
import { z } from "zod";

export type Quote = { id: string; who: string; text: string };

export const QUOTES: Quote[] = [
  { id: "q1", who: "P1", text: "I rebuild the same button in every file." },
  { id: "q2", who: "P2", text: "I never know which component is the latest one." },
  { id: "q3", who: "P3", text: "Handoff takes longer than the design itself." },
  { id: "q4", who: "P4", text: "Devs ask me for spacing values every single day." },
  { id: "q5", who: "P1", text: "Dark mode! Dark mode! We need dark mode everywhere!" },
  { id: "q6", who: "P5", text: "I copy old screens because finding the right part is slow." },
  { id: "q7", who: "P2", text: "The docs say one thing and the code does another." },
  { id: "q8", who: "P6", text: "I can't tell if a component is accessible until QA tells me." },
  { id: "q9", who: "P3", text: "Engineers rebuild my designs from screenshots." },
  { id: "q10", who: "P6", text: "Nobody told me the old modal was deprecated." },
];

export const ThemeSchema = (ids: Set<string>) =>
  z.object({
    id: z.string(),
    name: z.string().max(60),
    quoteIds: z.array(z.string().refine((q) => ids.has(q), { message: "Quote not in source" })).min(1),
    validated: z.boolean(),
  });

export type Theme = { id: string; name: string; quoteIds: string[]; validated: boolean };

// The recorded AI clustering. "t4" is weak on purpose: one participant, one loud quote.
export const AI_THEMES: Theme[] = [
  { id: "t1", name: "Finding the right component is slow", quoteIds: ["q1", "q2", "q6"], validated: true },
  { id: "t2", name: "Handoff loses information", quoteIds: ["q3", "q4", "q9"], validated: true },
  { id: "t3", name: "Docs and code drift apart", quoteIds: ["q7", "q10", "q8"], validated: true },
  { id: "t4", name: "Everyone wants dark mode", quoteIds: ["q5"], validated: true },
];

/** What the AI tried to return, including one invented quote the schema rejects. */
export const AI_RAW_EXTRA = { id: "t5", name: "Teams love the new tokens", quoteIds: ["q11"], validated: true };

export function participants(t: Theme): number {
  return new Set(t.quoteIds.map((id) => QUOTES.find((q) => q.id === id)?.who)).size;
}

export function scorecard(themes: Theme[]) {
  const assigned = new Set(themes.flatMap((t) => t.quoteIds));
  const weakClaimed = themes.filter((t) => t.validated && participants(t) < 2);
  const evidence = themes.length ? themes.filter((t) => participants(t) >= 2).length / themes.length : 0;
  return {
    coverage: Math.round((assigned.size / QUOTES.length) * 100),
    evidence: Math.round(evidence * 100),
    overclaims: weakClaimed.length,
    honest: weakClaimed.length === 0,
  };
}

export function toMarkdown(themes: Theme[]): string {
  return themes
    .map((t) => {
      const qs = t.quoteIds.map((id) => QUOTES.find((q) => q.id === id)!).map((q) => `- “${q.text}” (${q.who}, ${q.id})`);
      return `## ${t.name}${t.validated ? "" : " (unvalidated)"}\n${participants(t)} participant(s)\n${qs.join("\n")}`;
    })
    .join("\n\n");
}
