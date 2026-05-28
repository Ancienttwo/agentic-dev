#!/bin/bash
# Context Pressure Hook — PostToolUse (all tools)
# Prefers Codex rollout token-count signals and falls back to per-session tool counts.
# The recovery path is handoff + fresh-session resume, not remote compaction.

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/hook-input.sh"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/lib/session-state.sh"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/lib/workflow-state.sh"

COUNTER_DIR=".claude/.context-pressure"
SESSION_ID_FILE=".claude/.session-id"
mkdir -p "$COUNTER_DIR"
SESSION_KEY="$(session_state_resolve_key "$SESSION_ID_FILE")"
SESSION_SAFE_KEY="$(session_state_safe_key "$SESSION_KEY")"
COUNT_FILE="$COUNTER_DIR/${SESSION_SAFE_KEY}.count"
WARN_FILE="$COUNTER_DIR/${SESSION_SAFE_KEY}.warned"
RED_FILE="$COUNTER_DIR/${SESSION_SAFE_KEY}.red"
COUNT="$(session_state_read_count "$COUNT_FILE")"
COUNT=$((COUNT + 1))

echo "$COUNT" > "$COUNT_FILE"
echo "$COUNT" > ".claude/.tool-call-count"

SESSION_ID="$(hook_get_session_id "${1:-}")"
TRANSCRIPT_PATH="$(hook_get_transcript_path "${1:-}")"
HOOK_CWD="$(hook_get_cwd "${1:-}")"
BUDGET_JSON=""
ZONE=""
SOURCE=""
MESSAGE=""

emit_codex_plan_change_guard() {
  local tool_name changed_plan

  tool_name="$(hook_get_tool_name "${1:-}")"
  if [[ "$tool_name" != "apply_patch" ]]; then
    return 0
  fi

  changed_plan="$(has_changes_glob '^plans/plan-.*\.md$' || true)"
  if [[ -n "$changed_plan" ]]; then
    echo "[AnnotationGuard] ${changed_plan} has annotations. Process all notes and revise. Do not implement yet."
  fi
}

emit_codex_plan_change_guard "${1:-}"

if command -v bun >/dev/null 2>&1 && [[ -f "scripts/context-budget.ts" ]]; then
  BUDGET_JSON="$(
    bun scripts/context-budget.ts \
      --format json \
      --cwd "$HOOK_CWD" \
      --session-id "$SESSION_ID" \
      --transcript-path "$TRANSCRIPT_PATH" \
      --tool-count "$COUNT" \
      --write-status 2>/dev/null || true
  )"
fi

if [[ -n "$BUDGET_JSON" ]] && command -v jq >/dev/null 2>&1; then
  ZONE="$(printf '%s' "$BUDGET_JSON" | jq -r '.zone // empty' 2>/dev/null || true)"
  SOURCE="$(printf '%s' "$BUDGET_JSON" | jq -r '.source // empty' 2>/dev/null || true)"
  MESSAGE="$(printf '%s' "$BUDGET_JSON" | jq -r '.message // empty' 2>/dev/null || true)"
fi

if [[ -z "$ZONE" ]]; then
  if [[ "$COUNT" -ge 50 ]]; then
    ZONE="red"
    SOURCE="tool-call-count"
    MESSAGE="context red zone by tool-count fallback"
  elif [[ "$COUNT" -ge 40 ]]; then
    ZONE="orange"
    SOURCE="tool-call-count"
    MESSAGE="context orange zone by tool-count fallback"
  elif [[ "$COUNT" -ge 30 ]]; then
    ZONE="yellow"
    SOURCE="tool-call-count"
    MESSAGE="context yellow zone by tool-count fallback"
  else
    ZONE="green"
    SOURCE="tool-call-count"
    MESSAGE="context green zone by tool-count fallback"
  fi
fi

if [[ "$ZONE" == "yellow" && ! -f "$WARN_FILE" ]]; then
  echo "[ContextMonitor] Yellow zone (${SOURCE}). Persist research/todo/handoff state before continuing."
  touch "$WARN_FILE"
fi

if [[ "$ZONE" == "orange" && ! -f "$RED_FILE.orange" ]]; then
  echo "[ContextMonitor] Orange zone (${SOURCE}). Stop broad exploration and prepare a fresh-session resume packet."
  if [[ -f "scripts/prepare-codex-handoff.sh" ]]; then
    bash scripts/prepare-codex-handoff.sh --reason context-orange-zone >/dev/null 2>&1 || workflow_write_handoff "context-orange-zone"
  else
    workflow_write_handoff "context-orange-zone"
  fi
  touch "$RED_FILE.orange"
fi

if [[ "$ZONE" == "red" && ! -f "$RED_FILE" ]]; then
  echo "[ContextMonitor] Red zone (${SOURCE}). STOP after the current response; resume from the generated handoff in a fresh Codex session."
  if [[ -f "scripts/prepare-codex-handoff.sh" ]]; then
    bash scripts/prepare-codex-handoff.sh --reason context-red-zone >/dev/null 2>&1 || workflow_write_handoff "context-red-zone"
  else
    workflow_write_handoff "context-red-zone"
  fi

  touch "$RED_FILE"
fi
