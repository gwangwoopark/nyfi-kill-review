import { isDecision } from "@/lib/review";
import { decide, reopen } from "@/lib/review-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const b = (body ?? {}) as { decision?: unknown; reason?: unknown };

  if (b.decision === null) {
    await reopen(id);
    return Response.json({ ok: true });
  }
  if (!isDecision(b.decision)) {
    return Response.json({ ok: false, error: "decision must be kept or killed" }, { status: 400 });
  }
  const ok = await decide(id, b.decision, typeof b.reason === "string" ? b.reason : "");
  if (!ok) return Response.json({ ok: false, error: "no such idea" }, { status: 404 });
  return Response.json({ ok: true });
}
