"use client";

import { TASKS, type Task, type TaskInput, type TaskOutput } from "./ai-schemas";

export type AIResult<T> = { data: T; scripted: boolean };

const TIMEOUT_MS = 8000;

/**
 * Calls the server route. Falls back to the recorded (scripted) run when the API is
 * slow (over 8 s), down, unconfigured, rate-limited or returns something that fails the schema.
 * The page never breaks for a visitor.
 */
export async function runAI<T extends Task>(
  task: T,
  input: TaskInput<T>,
  scripted: () => TaskOutput<T>,
  signal?: AbortSignal,
): Promise<AIResult<TaskOutput<T>>> {
  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task, input }),
      signal: timeout.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "scripted" in body) throw new Error("scripted");
    const parsed = TASKS[task].output.safeParse(body);
    if (!parsed.success) throw new Error("schema");
    return { data: parsed.data as TaskOutput<T>, scripted: false };
  } catch (err) {
    if (signal?.aborted) throw err;
    return { data: scripted(), scripted: true };
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
