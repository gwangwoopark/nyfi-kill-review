import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The whole point: one URL that answers "did anyone use it?". */
export async function GET() {
  const db = await getDb();
  const rows = await db.all(
    "select name, count(*) as count from events group by name order by count desc"
  );
  const total = rows.reduce((n, r) => n + Number(r.count), 0);
  return Response.json({ total, byEvent: rows });
}
