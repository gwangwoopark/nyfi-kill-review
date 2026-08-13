import { describe, expect, it } from "vitest";
import { isDecision, parseTitles, reviewOrder, summarize, type Idea } from "@/lib/review";

function idea(p: Partial<Idea>): Idea {
  return {
    id: p.id ?? "x",
    title: p.title ?? "t",
    score: p.score ?? 0,
    decision: p.decision ?? null,
    reason: p.reason ?? "",
    created_at: p.created_at ?? "2026-01-01T00:00:00.000Z",
    decided_at: p.decided_at ?? null,
  };
}

describe("parseTitles", () => {
  it("drops blanks, collapses whitespace, dedupes case-insensitively", () => {
    expect(parseTitles("  a  b \n\n A B \n c ")).toEqual(["a b", "c"]);
  });
  it("returns nothing for empty input", () => {
    expect(parseTitles("\n  \n")).toEqual([]);
  });
});

describe("reviewOrder", () => {
  it("keeps only pending, lowest score first, then oldest", () => {
    const out = reviewOrder([
      idea({ id: "hi", score: 9 }),
      idea({ id: "done", score: 1, decision: "killed" }),
      idea({ id: "lo", score: 1 }),
      idea({ id: "lo2", score: 1, created_at: "2025-01-01T00:00:00.000Z" }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["lo2", "lo", "hi"]);
  });
});

describe("summarize", () => {
  it("counts and rounds the decided percentage", () => {
    const s = summarize([idea({ decision: "kept" }), idea({ decision: "killed" }), idea({})]);
    expect(s).toMatchObject({ total: 3, kept: 1, killed: 1, pending: 1, decidedPct: 67 });
  });
  it("is 0% on an empty board rather than NaN", () => {
    expect(summarize([]).decidedPct).toBe(0);
  });
});

describe("isDecision", () => {
  it("rejects anything that is not kept or killed", () => {
    expect(isDecision("kept")).toBe(true);
    expect(isDecision("queued")).toBe(false);
    expect(isDecision(null)).toBe(false);
  });
});
