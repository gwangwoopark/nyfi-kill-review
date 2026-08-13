/**
 * Kill Review — the weekly pass that forces every idea to kept or killed.
 *
 * The rule the prototype exists to test: an idea you will not defend this week
 * is dead. No "queued", no "later". Two buttons, one reason line, done.
 */

export type Decision = "kept" | "killed";

export interface Idea {
  id: string;
  title: string;
  score: number;
  decision: Decision | null;
  reason: string;
  created_at: string;
  decided_at: string | null;
}

export const MAX_TITLE = 200;
export const MAX_REASON = 200;

export function isDecision(v: unknown): v is Decision {
  return v === "kept" || v === "killed";
}

/** Blank lines out, whitespace collapsed, dupes (case-insensitive) dropped. */
export function parseTitles(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split("\n")) {
    const t = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/**
 * Review order: cheapest decisions first is a trap — you stall on the hard ones
 * and the session dies. Lowest score first, so the obvious kills clear early
 * and momentum carries you into the ones you actually care about.
 */
export function reviewOrder(ideas: Idea[]): Idea[] {
  return [...ideas]
    .filter((i) => i.decision === null)
    .sort((a, b) => a.score - b.score || a.created_at.localeCompare(b.created_at));
}

export interface Summary {
  total: number;
  kept: number;
  killed: number;
  pending: number;
  /** The number the review exists to move. 100% = nothing is rotting. */
  decidedPct: number;
}

export function summarize(ideas: Idea[]): Summary {
  const kept = ideas.filter((i) => i.decision === "kept").length;
  const killed = ideas.filter((i) => i.decision === "killed").length;
  const total = ideas.length;
  const pending = total - kept - killed;
  return {
    total,
    kept,
    killed,
    pending,
    decidedPct: total === 0 ? 0 : Math.round(((kept + killed) / total) * 100),
  };
}
