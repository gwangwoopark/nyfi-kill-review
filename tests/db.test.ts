import { describe, expect, it } from "vitest";
import { getDb, isPostgres, toPgPlaceholders } from "../lib/db";

describe("driver switch", () => {
  it("picks postgres only for postgres urls", () => {
    expect(isPostgres("postgres://x")).toBe(true);
    expect(isPostgres("postgresql://x")).toBe(true);
    expect(isPostgres("file:./a.db")).toBe(false);
  });

  it("rewrites ? placeholders for postgres", () => {
    expect(toPgPlaceholders("insert into t values (?, ?, ?)")).toBe(
      "insert into t values ($1, $2, $3)"
    );
  });
});

describe("events round-trip on sqlite", () => {
  it("stores an event and counts it", async () => {
    process.env.DATABASE_URL = ":memory:";
    const db = await getDb();
    await db.run(
      "insert into events (id, name, prototype, props, created_at) values (?, ?, ?, ?, ?)",
      ["1", "page_view", "hello", "{}", new Date().toISOString()]
    );
    const rows = await db.all("select name, count(*) as count from events group by name");
    expect(rows).toEqual([{ name: "page_view", count: 1 }]);
  });
});
