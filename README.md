# Kill Review — nyfi.dev Prototype #2

The weekly pass that forces every idea to **kept** or **killed**. Picked off the
Idea Inbox scoreboard: score 16.0 (impact 4 × conviction 4 ÷ effort 1), the
highest-scoring idea that is a product rather than infrastructure.

The rule it tests: *an idea you will not defend this week is dead.* No "queued",
no "later". Two keys — `k` keep, `x` kill — and one optional reason line.

## Run

    pnpm dev            # http://localhost:3000
    pnpm check          # typecheck + test + build

## Import your backlog

    curl -XPOST localhost:3000/api/ideas -H 'content-type: application/json' \
      -d '{"text": "one idea per line"}'

    # or straight off the Idea Inbox
    sqlite3 -json ../data/ideas.db \
      "select title, round(impact*conviction*1.0/effort,2) as score from ideas where state='queued'" \
      | xargs -0 -I{} curl -XPOST localhost:3000/api/ideas \
          -H 'content-type: application/json' -d '{"ideas": {}}'

## Kill bar

If nobody runs a second review session in the week after launch, kill it. A
review tool nobody re-opens is a to-do list with extra steps.

## Layout

    lib/review.ts        pure logic — ordering, parsing, summary (client-safe)
    lib/review-store.ts  sqlite/postgres persistence (server only)
    app/api/ideas        list + bulk import + decide/undo
    tests/review.test.ts the logic that would be expensive to get wrong
