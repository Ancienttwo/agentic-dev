#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if command -v bun >/dev/null 2>&1; then
  exec bun "$REPO_ROOT/src/cli/index.ts" tools ensure codegraph "$@"
fi

if [[ -x "${HOME}/.bun/bin/bun" ]]; then
  exec "${HOME}/.bun/bin/bun" "$REPO_ROOT/src/cli/index.ts" tools ensure codegraph "$@"
fi

echo "ensure-codegraph.sh requires bun" >&2
exit 1
