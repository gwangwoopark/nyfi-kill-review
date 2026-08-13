import { parseTitles, summarize } from "@/lib/review";
import { addIdeas, listIdeas } from "@/lib/review-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ideas = await listIdeas();
  return Response.json({ ideas, summary: summarize(ideas) });
}

/**
 * Two shapes, because the two real sources are a textarea and the Idea Inbox:
 *   { text: "one idea per line" }
 *   { ideas: [{ title, score }] }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const b = (body ?? {}) as { text?: unknown; ideas?: unknown };

  let items: { title: string; score?: number }[] = [];
  if (typeof b.text === "string") {
    items = parseTitles(b.text).map((title) => ({ title }));
  } else if (Array.isArray(b.ideas)) {
    items = b.ideas
      .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
      .map((i) => ({ title: String(i.title ?? ""), score: Number(i.score ?? 0) }));
  } else {
    return Response.json({ ok: false, error: "expected text or ideas" }, { status: 400 });
  }

  if (items.length === 0) {
    return Response.json({ ok: false, error: "nothing to add" }, { status: 400 });
  }
  const added = await addIdeas(items);
  return Response.json({ ok: true, added });
}
