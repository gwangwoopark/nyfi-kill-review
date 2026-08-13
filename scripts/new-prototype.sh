#!/usr/bin/env bash
# Create a new prototype from this template.
#   ./scripts/new-prototype.sh my-idea [target-dir]
set -euo pipefail

NAME="${1:-}"
if [[ -z "$NAME" ]]; then
  echo "usage: $0 <prototype-name> [target-dir]" >&2
  exit 1
fi

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${2:-$(dirname "$TEMPLATE_DIR")/$NAME}"

if [[ -e "$TARGET" ]]; then
  echo "$TARGET already exists" >&2
  exit 1
fi

echo "==> copying template to $TARGET"
mkdir -p "$TARGET"
# everything tracked by the template, minus build artifacts and git history
(cd "$TEMPLATE_DIR" && tar --exclude=.git --exclude=node_modules --exclude=.next \
  --exclude=.vercel --exclude='*.db' -cf - .) | (cd "$TARGET" && tar -xf -)

cd "$TARGET"
sed -i.bak "s/\"name\": \"nyfi-prototype\"/\"name\": \"$NAME\"/" package.json && rm package.json.bak
sed -i.bak "s/^NEXT_PUBLIC_PROTOTYPE_NAME=.*/NEXT_PUBLIC_PROTOTYPE_NAME=$NAME/" .env.example && rm .env.example.bak
cp .env.example .env.local

echo "==> installing"
pnpm install

git init -q && git add -A && git commit -qm "init $NAME from nyfi starter"

cat <<MSG

  $NAME is ready at $TARGET

  next:
    cd $TARGET
    pnpm dev        # http://localhost:3000
    pnpm check      # typecheck + test + build
    pnpm deploy     # public URL

MSG
