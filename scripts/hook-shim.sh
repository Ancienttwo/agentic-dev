#!/usr/bin/env bash
# scripts/hook-shim.sh — repo-harness global hook dispatcher (Phase 0.5 bash prototype).
#
# Installed by `scripts/repo-harness.sh install` to ~/.repo-harness/hook-shim.sh.
# Phase 1 CLI replaces this file with `repo-harness hook <event>` subcommand.
#
# Invoked from user-level hook configs:
#   bash ~/.repo-harness/hook-shim.sh <hook-script-name>.sh [extra-args...]
#
# Behavior:
#   1. Resolve current repo via `git rev-parse --show-toplevel`
#   2. If not in a git repo OR not repo-harness opt-in → silent exit 0
#   3. Delegate to existing `<repo>/.ai/hooks/run-hook.sh <hook> [args...]`
#      (reuses tested project-level dispatcher logic; preserves HOOK_REPO_ROOT contract)
#
# Opt-in marker: .ai/harness/workflow-contract.json (any non-opt-in repo is no-op)

set -euo pipefail

HOOK_NAME="${1:-}"
if [ -z "$HOOK_NAME" ]; then
  echo "[repo-harness-shim] missing hook script name" >&2
  exit 2
fi

repo=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$repo/.ai/harness/workflow-contract.json" ] || exit 0

# Safety: defer to project-level if it still exists (prevents double-fire on
# non-migrated repos). After `repo-harness migrate <repo>` removes the project
# .codex/hooks.json, this guard releases and the global shim takes over.
[ -f "$repo/.codex/hooks.json" ] && exit 0

[ -f "$repo/.ai/hooks/run-hook.sh" ] || exit 0

export HOOK_REPO_ROOT="$repo"
exec bash "$repo/.ai/hooks/run-hook.sh" "$@"
