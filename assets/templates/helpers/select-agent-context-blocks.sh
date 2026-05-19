#!/bin/bash
set -euo pipefail

repo="${1:-.}"
repo="$(cd "$repo" && pwd)"
config_file="${PROJECT_INITIALIZER_CONTEXT_BLOCKS_FILE:-$repo/.ai/context/agent-context-blocks.txt}"

emit_lines() {
  sed -e 's/#.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | sed '/^$/d'
}

emit_existing_dirs() {
  while IFS= read -r rel_dir; do
    rel_dir="${rel_dir#./}"
    rel_dir="${rel_dir%/}"
    [[ -z "$rel_dir" || "$rel_dir" == "." ]] && continue
    case "$rel_dir" in
      /*|../*|*/../*|*\"*)
        continue
        ;;
    esac
    [[ -d "$repo/$rel_dir" ]] || continue
    printf '%s\n' "$rel_dir"
  done | sort -u
}

if [[ -n "${PROJECT_INITIALIZER_CONTEXT_BLOCKS:-}" ]]; then
  printf '%s\n' "$PROJECT_INITIALIZER_CONTEXT_BLOCKS" | tr ',:' '\n' | emit_lines | emit_existing_dirs
  exit 0
fi

if [[ -f "$config_file" ]]; then
  emit_lines < "$config_file" | emit_existing_dirs
  exit 0
fi

find "$repo" \
  \( -path "$repo/.git" -o -path "$repo/node_modules" -o -path "$repo/.ai" -o -path "$repo/.claude" \) -prune -o \
  \( -type f \( -name 'CLAUDE.md' -o -name 'AGENTS.md' \) \) -print 2>/dev/null | while IFS= read -r context_file; do
    context_dir="$(dirname "$context_file")"
    rel_dir="${context_dir#$repo/}"
    [[ "$rel_dir" == "$context_dir" || "$rel_dir" == "." ]] && continue
    printf '%s\n' "$rel_dir"
  done | sort -u
