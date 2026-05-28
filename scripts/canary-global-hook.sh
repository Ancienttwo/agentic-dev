#!/usr/bin/env bash
# scripts/canary-global-hook.sh
#
# Phase 0 canary for repo-harness global hook runtime.
# Writes a tagged noop hook to ~/.codex/hooks.json AND ~/.claude/settings.json
# for SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Stop events.
# Each fire appends a line to ~/.repo-harness-canary.log with host + event + repo.
#
# Goal: verify both hosts load user-level hooks; observe trust UX (Codex) and
# auto-reload (Claude); confirm trust hash registration in ~/.codex/config.toml
# under user-level [hooks.state] keys.
#
# See: plans/plan-20260528-1436-hook-global-runtime.md (Phase 0)
#      tasks/notes/hook-global-runtime.notes.md (verification rounds 1+2)

set -euo pipefail

CANARY_LOG="${HOME}/.repo-harness-canary.log"
CODEX_HOOKS="${HOME}/.codex/hooks.json"
CLAUDE_SETTINGS="${HOME}/.claude/settings.json"
CODEX_CONFIG="${HOME}/.codex/config.toml"
CANARY_TAG="repo-harness-canary"

EVENTS=(SessionStart PreToolUse PostToolUse UserPromptSubmit Stop)

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[canary] ERROR: jq is required (install: brew install jq)" >&2
    exit 1
  fi
}

# Build the hook command string that gets stored in JSON.
# When fired, appends to CANARY_LOG: [tag] host=<X> event=<Y> repo=<path> ts=<iso>
build_cmd_for() {
  local host=$1
  local event=$2
  printf 'echo "[%s] host=%s event=%s repo=$(git rev-parse --show-toplevel 2>/dev/null || echo none) ts=$(date -Iseconds)" >> %s' \
    "$CANARY_TAG" "$host" "$event" "$CANARY_LOG"
}

# Idempotent install: removes any prior entry tagged with CANARY_TAG, then appends fresh.
install_to_file() {
  local file=$1
  local host=$2
  local backup="${file}.${CANARY_TAG}-backup"

  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    echo '{}' > "$file"
  fi

  # One-time backup
  if [[ ! -f "$backup" ]]; then
    cp "$file" "$backup"
    echo "[canary] Backed up ${file} → ${backup}"
  fi

  local tmp
  tmp=$(mktemp)
  # Ensure .hooks exists
  jq '.hooks //= {}' "$file" > "$tmp" && mv "$tmp" "$file"

  for event in "${EVENTS[@]}"; do
    local cmd
    cmd=$(build_cmd_for "$host" "$event")
    tmp=$(mktemp)
    # 1) Remove any existing canary hookset for this event
    jq --arg event "$event" --arg tag "$CANARY_TAG" '
      .hooks[$event] = (
        (.hooks[$event] // [])
        | map(select(
            (.hooks // [])
            | all((.command // "") | contains($tag) | not)
          ))
      )
    ' "$file" > "$tmp" && mv "$tmp" "$file"

    # 2) Append fresh canary hookset
    tmp=$(mktemp)
    jq --arg event "$event" --arg cmd "$cmd" '
      .hooks[$event] = (
        (.hooks[$event] // [])
        + [{"hooks":[{"type":"command","command":$cmd}]}]
      )
    ' "$file" > "$tmp" && mv "$tmp" "$file"
  done

  rm -f "$tmp"
  echo "[canary] Installed ${host} canary hooks into ${file}"
}

uninstall_from_file() {
  local file=$1
  if [[ ! -f "$file" ]]; then
    echo "[canary] ${file} does not exist, skipping"
    return
  fi

  local tmp
  for event in "${EVENTS[@]}"; do
    tmp=$(mktemp)
    jq --arg event "$event" --arg tag "$CANARY_TAG" '
      .hooks[$event] = (
        (.hooks[$event] // [])
        | map(select(
            (.hooks // [])
            | all((.command // "") | contains($tag) | not)
          ))
      )
    ' "$file" > "$tmp" && mv "$tmp" "$file"
  done

  # Drop empty event arrays for cleanliness
  tmp=$(mktemp)
  jq '.hooks |= with_entries(select(.value | length > 0))' "$file" > "$tmp" && mv "$tmp" "$file"
  rm -f "$tmp"

  echo "[canary] Removed canary entries from ${file} (backup preserved if any)"
}

status() {
  echo "=== repo-harness canary status ==="
  echo "Tag: ${CANARY_TAG}"
  echo "Log: ${CANARY_LOG}"
  if [[ -f "$CANARY_LOG" ]]; then
    local lines
    lines=$(wc -l < "$CANARY_LOG" | tr -d ' ')
    echo "  Lines: ${lines}"
    if [[ "$lines" -gt 0 ]]; then
      echo "  Last 5:"
      tail -5 "$CANARY_LOG" | sed 's/^/    /'
    fi
  else
    echo "  (not created yet — install + trigger events first)"
  fi
  echo ""

  for pair in "codex:${CODEX_HOOKS}" "claude:${CLAUDE_SETTINGS}"; do
    local host=${pair%%:*}
    local file=${pair#*:}
    echo "Host: ${host}"
    echo "  File: ${file}"
    if [[ -f "$file" ]]; then
      local count
      count=$(jq --arg tag "$CANARY_TAG" '
        [.hooks // {}
         | to_entries[]
         | .value[]
         | .hooks // []
         | .[]
         | select((.command // "") | contains($tag))
        ] | length
      ' "$file" 2>/dev/null || echo 0)
      echo "  Canary hooks installed: ${count} (expected: ${#EVENTS[@]})"
    else
      echo "  (file does not exist)"
    fi
  done
  echo ""

  echo "=== Codex trust state (~/.codex/config.toml) ==="
  if [[ -f "$CODEX_CONFIG" ]]; then
    local pattern="^\[hooks\.state\.\"${HOME}/\.codex/hooks\.json"
    local user_level
    user_level=$(grep -c "$pattern" "$CODEX_CONFIG" 2>/dev/null || true)
    user_level=${user_level:-0}
    echo "  User-level trust hash entries (~/.codex/hooks.json:...): ${user_level}"
    if [[ "$user_level" -gt 0 ]]; then
      echo "  Sample (first 3):"
      grep "$pattern" "$CODEX_CONFIG" | head -3 | sed 's/^/    /'
    else
      echo "  (none yet — Codex may not have prompted to trust the canary, or you declined)"
    fi
  else
    echo "  (config.toml not found at ${CODEX_CONFIG})"
  fi
}

usage() {
  cat <<EOF
Usage: $0 <install|uninstall|status|tail>

  install    Add tagged canary hooks to ~/.codex/hooks.json AND ~/.claude/settings.json
             Events: ${EVENTS[*]}
             Each fire appends to: ${CANARY_LOG}
             Backups: <file>.${CANARY_TAG}-backup (first install only)

  uninstall  Remove canary entries from both hook config files (preserves backups + log)

  status     Show canary entry count per host + Codex user-level trust hash registration

  tail       tail -f ${CANARY_LOG}

After install:
  1. Restart Codex — may show trust prompt (accept to register hash)
  2. Restart Claude Code OR wait for ConfigChange auto-reload
  3. Trigger events:
     - SessionStart: launching the agent
     - UserPromptSubmit: send any prompt
     - PreToolUse / PostToolUse: edit a file, run bash, etc.
     - Stop: end the session
  4. Run '$0 status' to confirm canary installed + Codex trust registration
  5. Run '$0 tail' or 'tail ${CANARY_LOG}' to see fires
  6. Repeat across 2-3 repos (opt-in + non-opt-in) for coverage
  7. Record findings in docs/architecture/global-hook-runtime.md Host Operational Matrix
  8. Run '$0 uninstall' to clean up

EOF
}

main() {
  case "${1:-}" in
    install)
      require_jq
      install_to_file "$CODEX_HOOKS" "codex"
      install_to_file "$CLAUDE_SETTINGS" "claude"
      cat <<EOF

[canary] Install complete. Next steps:
  1. Restart Codex (you may see a trust prompt — accept it to register the hash)
  2. Restart Claude Code, OR run any command to trigger ConfigChange auto-reload
  3. Trigger events: send a prompt, edit a file, run bash, end session
  4. tail -f ${CANARY_LOG}      # watch fires
  5. $0 status                  # check hook count + Codex trust hash
  6. $0 uninstall               # when done

Backups created (first install only): ~/.codex/hooks.json.${CANARY_TAG}-backup
                                       ~/.claude/settings.json.${CANARY_TAG}-backup
EOF
      ;;
    uninstall)
      require_jq
      uninstall_from_file "$CODEX_HOOKS"
      uninstall_from_file "$CLAUDE_SETTINGS"
      echo ""
      echo "[canary] Log preserved at ${CANARY_LOG} (delete manually if not needed)"
      echo "[canary] Backups preserved at <file>.${CANARY_TAG}-backup (delete manually)"
      ;;
    status)
      require_jq
      status
      ;;
    tail)
      if [[ ! -f "$CANARY_LOG" ]]; then
        echo "[canary] Log not yet created at ${CANARY_LOG}"
        echo "[canary] Run '$0 install' first, then trigger events"
        exit 1
      fi
      exec tail -f "$CANARY_LOG"
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      echo "[canary] Unknown command: $1" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
