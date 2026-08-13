"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { reviewOrder, summarize, type Decision, type Idea } from "@/lib/review";
import { add, list, setDecision, STATIC_MODE } from "@/lib/store";

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setIdeas(await list());
  }, []);

  useEffect(() => {
    track("page_view", { path: "/" });
    void load();
  }, [load]);

  const queue = useMemo(() => (ideas ? reviewOrder(ideas) : []), [ideas]);
  const summary = useMemo(() => summarize(ideas ?? []), [ideas]);
  const current = queue[0];

  async function addIdeas() {
    if (!text.trim() || busy) return;
    setBusy(true);
    await add(text);
    setText("");
    await load();
    setBusy(false);
  }

  async function submit(decision: Decision) {
    if (!current || busy) return;
    setBusy(true);
    // The event the prototype exists to test: did anyone actually kill something?
    track("activated", { decision, hadReason: reason.trim().length > 0 });
    await setDecision(current.id, decision, reason);
    setReason("");
    await load();
    setBusy(false);
  }

  async function reopen(id: string) {
    await setDecision(id, null);
    await load();
  }

  // Keyboard is the whole point: a review you can run in 90 seconds.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "k" || e.key === "K") void submit("kept");
      if (e.key === "x" || e.key === "X") void submit("killed");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const decided = ideas?.filter((i) => i.decision) ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-14">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Kill Review</h1>
        <span className="text-sm text-neutral-500">
          {summary.decidedPct}% decided · {summary.pending} rotting
        </span>
      </header>

      {ideas === null ? (
        <p className="text-neutral-500">loading…</p>
      ) : current ? (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
            {queue.length} left · defend it or lose it
          </p>
          <p className="mb-5 text-xl leading-snug">{current.title}</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="one line: why (optional)"
            rows={2}
            className="mb-4 w-full resize-none rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
          <div className="flex gap-3">
            <button
              onClick={() => submit("kept")}
              disabled={busy}
              className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
            >
              Keep <span className="text-neutral-500">(k)</span>
            </button>
            <button
              onClick={() => submit("killed")}
              disabled={busy}
              className="rounded-md border border-red-900 bg-red-950/60 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-900/60 disabled:opacity-50"
            >
              Kill <span className="text-red-400/70">(x)</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <p className="text-lg">
            {summary.total === 0
              ? "Nothing to review. Paste your backlog below."
              : `Inbox zero. ${summary.kept} kept, ${summary.killed} killed.`}
          </p>
        </section>
      )}

      <section>
        <label className="mb-2 block text-sm text-neutral-400">
          Add ideas — one per line
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
        <button
          onClick={addIdeas}
          disabled={busy}
          className="mt-2 rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500 disabled:opacity-50"
        >
          add
        </button>
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm uppercase tracking-wide text-neutral-500">
            This week&apos;s decisions
          </h2>
          <ul className="flex flex-col gap-2">
            {decided.map((i) => (
              <li
                key={i.id}
                className="flex items-start justify-between gap-4 border-b border-neutral-900 pb-2 text-sm"
              >
                <span className={i.decision === "killed" ? "text-neutral-500 line-through" : ""}>
                  {i.title}
                  {i.reason && (
                    <span className="block text-xs text-neutral-600">{i.reason}</span>
                  )}
                </span>
                <button
                  onClick={() => reopen(i.id)}
                  className="shrink-0 text-xs text-neutral-600 hover:text-neutral-300"
                >
                  undo
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {STATIC_MODE ? (
        <p className="text-xs text-neutral-600">
          Static build — your review lives in this browser only.
        </p>
      ) : (
        <a href="/api/stats" className="text-xs text-neutral-600 underline">
          did anyone use it? → /api/stats
        </a>
      )}
    </main>
  );
}
