#!/usr/bin/env bash
# Static export for a free host (GitHub Pages). The API routes cannot exist in
# an `output: export` build, so they are moved aside for the duration and the
# client falls back to localStorage (NEXT_PUBLIC_STATIC=1).
#
#   BASE_PATH=/nyfi-kill-review bash scripts/export.sh   -> ./out
set -euo pipefail
cd "$(dirname "$0")/.."

restore() { [ -d .api-parked ] && mv .api-parked app/api || true; }
trap restore EXIT

mv app/api .api-parked
NEXT_PUBLIC_STATIC=1 \
NEXT_PUBLIC_PROTOTYPE_NAME="${NEXT_PUBLIC_PROTOTYPE_NAME:-kill-review}" \
BASE_PATH="${BASE_PATH:-}" \
STATIC_EXPORT=1 \
  pnpm exec next build

touch out/.nojekyll
echo "static export ready: $(pwd)/out"
