/**
 * One client-facing store with two backends:
 *   server mode (default) — the /api routes, sqlite or pg behind them
 *   static mode           — localStorage, so the app can ship as a static
 *                           export to a free host with no server at all
 *
 * NEXT_PUBLIC_STATIC=1 picks the second at build time.
 */
"use client";

import { parseTitles, type Decision, type Idea } from "@/lib/review";
import { addLocal, decideLocal, loadIdeas, saveIdeas } from "@/lib/local-store";

export const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC === "1";

export async function list(): Promise<Idea[]> {
  if (STATIC_MODE) return loadIdeas();
  const r = await fetch("/api/ideas", { cache: "no-store" });
  const j = await r.json();
  return j.ideas as Idea[];
}

export async function add(text: string): Promise<void> {
  if (STATIC_MODE) {
    saveIdeas(addLocal(loadIdeas(), parseTitles(text), new Date().toISOString()));
    return;
  }
  await fetch("/api/ideas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function setDecision(
  id: string,
  decision: Decision | null,
  reason = ""
): Promise<void> {
  if (STATIC_MODE) {
    saveIdeas(decideLocal(loadIdeas(), id, decision, reason, new Date().toISOString()));
    return;
  }
  await fetch(`/api/ideas/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ decision, reason }),
  });
}
