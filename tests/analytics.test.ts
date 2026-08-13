import { describe, expect, it } from "vitest";
import { isValidEvent } from "../lib/analytics";

describe("isValidEvent", () => {
  it("accepts the two events every prototype ships with", () => {
    expect(isValidEvent({ name: "page_view", prototype: "hello" })).toBe(true);
    expect(isValidEvent({ name: "activated", prototype: "hello", props: { a: 1 } })).toBe(true);
  });

  it("rejects junk", () => {
    expect(isValidEvent(null)).toBe(false);
    expect(isValidEvent({ name: "", prototype: "hello" })).toBe(false);
    expect(isValidEvent({ name: "x" })).toBe(false);
    expect(isValidEvent({ name: "x".repeat(65), prototype: "hello" })).toBe(false);
  });
});
