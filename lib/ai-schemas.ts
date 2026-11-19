import { z } from "zod";
import registry from "./registry.json";

export const MAX_INPUT = 500;

export const componentNames = registry.components.map((c) => c.name) as [string, ...string[]];

// ---- stop 04: one card per step ----
export const PlanCardInput = z.object({
  goal: z.string().max(MAX_INPUT),
  step: z.string().max(40),
  baseline: z.string().max(300),
  redirect: z.string().max(40).nullable(),
});
export const PlanCardOutput = z.object({ detail: z.string().min(10).max(160) });

// ---- stop 05: empty-state copy ----
export const CopyInput = z.object({ tone: z.enum(["formal", "friendly", "playful", "chaotic"]) });
export const CopyOption = z.object({
  title: z.string().max(40),
  body: z.string().max(120),
  cta: z.string().max(20),
});
export const CopyOutput = z.object({ options: z.array(CopyOption).length(3) });

// ---- stop 09: a validated UI tree, never raw JSX ----
export const UINode = z.object({
  id: z.string().max(12),
  parent: z.string().max(12).nullable(),
  component: z.enum(componentNames),
  props: z.array(z.object({ name: z.string().max(20), value: z.string().max(140) })).max(6),
});
export const UITreeInput = z.object({ request: z.string().max(MAX_INPUT) });
export const UITreeOutput = z.object({
  status: z.enum(["built", "refused"]),
  reason: z.string().max(200),
  nodes: z.array(UINode).max(12),
});

export const TASKS = {
  "plan-card": { input: PlanCardInput, output: PlanCardOutput },
  copy: { input: CopyInput, output: CopyOutput },
  "ui-tree": { input: UITreeInput, output: UITreeOutput },
} as const;

export type Task = keyof typeof TASKS;
export type TaskInput<T extends Task> = z.infer<(typeof TASKS)[T]["input"]>;
export type TaskOutput<T extends Task> = z.infer<(typeof TASKS)[T]["output"]>;
export type CopyOptionT = z.infer<typeof CopyOption>;
export type UINodeT = z.infer<typeof UINode>;
export type UITreeT = z.infer<typeof UITreeOutput>;
