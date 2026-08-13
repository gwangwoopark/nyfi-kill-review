/**
 * Every prototype answers one question: did anyone use it?
 * Two events are enough to answer it. Add more only when you have a question
 * the existing two cannot answer.
 *   page_view -> someone showed up
 *   activated -> someone did the thing the prototype exists to test
 */
export type EventName = "page_view" | "activated" | (string & {});

export interface AnalyticsEvent {
  name: EventName;
  prototype: string;
  props?: Record<string, unknown>;
}

export const PROTOTYPE_NAME =
  process.env.NEXT_PUBLIC_PROTOTYPE_NAME ?? "unnamed-prototype";

/**
 * Static exports have no /api/events of their own, so they post to whatever
 * ingest URL the build was given (the scoreboard, once it has a host). Unset
 * means the local counter below is all we get.
 */
export const EVENTS_URL =
  process.env.NEXT_PUBLIC_EVENTS_URL ||
  (process.env.NEXT_PUBLIC_STATIC === "1" ? "" : "/api/events");

/** Local fallback tally so a static build can still answer "did anyone use it?" */
function bump(name: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    const k = "kill-review.events.v1";
    const t = JSON.parse(localStorage.getItem(k) ?? "{}") as Record<string, number>;
    t[name] = (t[name] ?? 0) + 1;
    localStorage.setItem(k, JSON.stringify(t));
  } catch {
    // swallow
  }
}

export function localEventCounts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("kill-review.events.v1") ?? "{}");
  } catch {
    return {};
  }
}

/** Client-side. Fire-and-forget: analytics must never break the prototype. */
export function track(name: EventName, props?: Record<string, unknown>): void {
  const body: AnalyticsEvent = { name, prototype: PROTOTYPE_NAME, props };
  bump(name);
  if (!EVENTS_URL) return; // static build with no ingest host yet — local tally only
  try {
    const payload = JSON.stringify(body);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(EVENTS_URL, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(EVENTS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // swallow
  }
}

export function isValidEvent(v: unknown): v is AnalyticsEvent {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.name === "string" && e.name.length > 0 && e.name.length <= 64
    && typeof e.prototype === "string" && e.prototype.length > 0;
}
