/**
 * Browser-only persistence, used when the app is served as a static export
 * (GitHub Pages) and there is no API to talk to. Same four operations as
 * `review-store.ts`, so `store.ts` can swap between them.
 *
 * The mutations are pure functions over an Idea[] so they are testable without
 * a DOM; only load/save touch localStorage.
 */
import { isDecision, MAX_TITLE, MAX_REASON, type Decision, type Idea } from "@/lib/review";

export const KEY = "kill-review.ideas.v1";

export function loadIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isIdea).sort(byScore);
  } catch {
    return [];
  }
}

export function saveIdeas(ideas: Idea[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ideas));
  } catch {
    // quota / private mode — the review still works for this session
  }
}

function isIdea(v: unknown): v is Idea {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.title === "string";
}

function byScore(a: Idea, b: Idea): number {
  return b.score - a.score || a.created_at.localeCompare(b.created_at);
}

export function addLocal(ideas: Idea[], titles: string[], now: string): Idea[] {
  const added = titles
    .map((t) => t.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE))
    .filter(Boolean)
    .map<Idea>((title) => ({
      id: crypto.randomUUID(),
      title,
      score: 0,
      decision: null,
      reason: "",
      created_at: now,
      decided_at: null,
    }));
  return [...ideas, ...added].sort(byScore);
}

export function decideLocal(
  ideas: Idea[],
  id: string,
  decision: Decision | null,
  reason: string,
  now: string
): Idea[] {
  return ideas.map((i) =>
    i.id !== id
      ? i
      : isDecision(decision)
        ? { ...i, decision, reason: reason.trim().slice(0, MAX_REASON), decided_at: now }
        : { ...i, decision: null, reason: "", decided_at: null }
  );
}
