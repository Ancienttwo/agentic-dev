#!/bin/bash
# Delegate workflow migrations to the canonical upstream project-initializer.
#
# Generated projects keep installed workflow runtime state under .ai/. The
# template source lives in PROJECT_INITIALIZER_ROOT, defaulting to the Codex or
# Claude runtime copy.

set -euo pipefail

resolve_project_initializer_root() {
  if [[ -n "${PROJECT_INITIALIZER_ROOT:-}" ]]; then
    printf '%s\n' "$PROJECT_INITIALIZER_ROOT"
    return 0
  fi

  if [[ -n "${HOME:-}" ]]; then
    local codex_root="$HOME/.codex/skills/project-initializer"
    local claude_root="$HOME/.claude/skills/project-initializer"
    local agents_root="$HOME/.agents/skills/project-initializer"

    if [[ -d "$codex_root" ]]; then
      printf '%s\n' "$codex_root"
      return 0
    fi

    if [[ -d "$claude_root" ]]; then
      printf '%s\n' "$claude_root"
      return 0
    fi

    printf '%s\n' "$agents_root"
    return 0
  fi

  printf '%s\n' "/Users/ancienttwo/.agents/skills/project-initializer"
}

UPSTREAM_ROOT="$(resolve_project_initializer_root)"
UPSTREAM_SCRIPT="$UPSTREAM_ROOT/scripts/migrate-project-template.sh"

if [[ ! -f "$UPSTREAM_SCRIPT" ]]; then
  echo "[migrate] Upstream project-initializer migration script not found: $UPSTREAM_SCRIPT" >&2
  echo "[migrate] Set PROJECT_INITIALIZER_ROOT to the project-initializer skill root." >&2
  exit 1
fi

exec bash "$UPSTREAM_SCRIPT" "$@"
