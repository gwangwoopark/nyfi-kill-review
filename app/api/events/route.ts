import { getDb } from "@/lib/db";
import { isValidEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!isValidEvent(body)) {
    return Response.json({ ok: false, error: "bad event" }, { status: 400 });
  }

  const db = await getDb();
  await db.run(
    "insert into events (id, name, prototype, props, created_at) values (?, ?, ?, ?, ?)",
    [
      crypto.randomUUID(),
      body.name,
      body.prototype,
      JSON.stringify(body.props ?? {}),
      new Date().toISOString(),
    ]
  );
  return Response.json({ ok: true });
}
