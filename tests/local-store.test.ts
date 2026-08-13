import { describe, expect, it } from "vitest";
import { addLocal, decideLocal } from "@/lib/local-store";
import { reviewOrder, summarize } from "@/lib/review";

const NOW = "2026-08-13T00:00:00.000Z";

describe("local-store (static build backend)", () => {
  it("adds titles and keeps them pending", () => {
    const ideas = addLocal([], ["one", "  two  ", ""], NOW);
    expect(ideas.map((i) => i.title)).toEqual(["one", "two"]);
    expect(reviewOrder(ideas)).toHaveLength(2);
  });

  it("decides and reopens", () => {
    const ideas = addLocal([], ["one"], NOW);
    const killed = decideLocal(ideas, ideas[0].id, "killed", " no user ", NOW);
    expect(killed[0]).toMatchObject({ decision: "killed", reason: "no user", decided_at: NOW });
    expect(summarize(killed).decidedPct).toBe(100);

    const back = decideLocal(killed, ideas[0].id, null, "", NOW);
    expect(back[0]).toMatchObject({ decision: null, reason: "", decided_at: null });
  });

  it("ignores unknown ids", () => {
    const ideas = addLocal([], ["one"], NOW);
    expect(decideLocal(ideas, "nope", "kept", "", NOW)).toEqual(ideas);
  });
});
