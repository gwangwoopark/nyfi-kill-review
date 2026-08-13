/**
 * Server-side persistence for Kill Review. Kept out of `review.ts` so the
 * client page can import the pure logic without dragging `pg` into the bundle.
 */
import { getDb, type Db, type Row } from "@/lib/db";
import { isDecision, MAX_TITLE, MAX_REASON, type Decision, type Idea } from "@/lib/review";

export async function getReviewDb(): Promise<Db> {
  const db = await getDb();
  await db.exec(
    `create table if not exists ideas (
      id text primary key,
      title text not null,
      score real not null default 0,
      decision text,
      reason text not null default '',
      created_at text not null,
      decided_at text
    )`
  );
  return db;
}

function toIdea(r: Row): Idea {
  return {
    id: String(r.id),
    title: String(r.title),
    score: Number(r.score),
    decision: isDecision(r.decision) ? r.decision : null,
    reason: String(r.reason ?? ""),
    created_at: String(r.created_at),
    decided_at: r.decided_at == null ? null : String(r.decided_at),
  };
}

export async function listIdeas(): Promise<Idea[]> {
  const db = await getReviewDb();
  const rows = await db.all("select * from ideas order by score desc, created_at asc");
  return rows.map(toIdea);
}

export async function addIdeas(
  items: { title: string; score?: number }[]
): Promise<number> {
  const db = await getReviewDb();
  const now = new Date().toISOString();
  let n = 0;
  for (const it of items) {
    const title = it.title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
    if (!title) continue;
    await db.run(
      "insert into ideas (id, title, score, created_at) values (?, ?, ?, ?)",
      [crypto.randomUUID(), title, Number.isFinite(it.score) ? Number(it.score) : 0, now]
    );
    n++;
  }
  return n;
}

export async function decide(
  id: string,
  decision: Decision,
  reason: string
): Promise<boolean> {
  const db = await getReviewDb();
  const found = await db.all("select id from ideas where id = ?", [id]);
  if (found.length === 0) return false;
  await db.run("update ideas set decision = ?, reason = ?, decided_at = ? where id = ?", [
    decision,
    reason.trim().slice(0, MAX_REASON),
    new Date().toISOString(),
    id,
  ]);
  return true;
}

export async function reopen(id: string): Promise<void> {
  const db = await getReviewDb();
  await db.run(
    "update ideas set decision = null, reason = '', decided_at = null where id = ?",
    [id]
  );
}
