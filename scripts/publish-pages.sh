#!/usr/bin/env bash
# Public URL with no account, no card, no server: static export -> GitHub Pages.
# Use this when the prototype can live entirely in the browser. If it needs the
# API routes, use scripts/deploy.sh (Vercel) instead.
#
#   REPO=nyfi-<name> bash scripts/publish-pages.sh
#
# Idempotent: safe to re-run on every change.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="${REPO:-$(basename "$PWD")}"
OWNER="${OWNER:-$(gh api user --jq .login)}"
SLUG="$OWNER/$REPO"

echo "==> building static export for /$REPO"
BASE_PATH="/$REPO" bash scripts/export.sh

if ! gh repo view "$SLUG" >/dev/null 2>&1; then
  echo "==> creating public repo $SLUG"
  gh repo create "$SLUG" --public -d "nyfi.dev prototype: $REPO"
fi

echo "==> pushing ./out to gh-pages"
tmp="$(mktemp -d)"
cp -R out/. "$tmp/"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.email=bot@nyfi.dev -c user.name=nyfi commit -qm "publish $REPO"
git -C "$tmp" -c credential.helper="!gh auth git-credential" push -q --force "https://github.com/$SLUG.git" gh-pages
rm -rf "$tmp"

# Pages config is sticky; only needs setting the first time.
gh api -X POST "repos/$SLUG/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null 2>&1 || true

echo
echo "==> live (allow ~60s on first publish):"
echo "    https://$OWNER.github.io/$REPO/"
