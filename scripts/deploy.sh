#!/usr/bin/env bash
# One command to a public URL. Requires a Vercel account (free tier).
# First run: `npx vercel login`, then `pnpm deploy` — it links and ships.
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "not a git repo — run scripts/new-prototype.sh first" >&2
  exit 1
fi

echo "==> deploying to vercel (production)"
npx --yes vercel@latest deploy --prod --yes

echo
echo "==> done. Record the URL above as a preview_url work product."
echo "    Then check /api/stats after someone visits."
