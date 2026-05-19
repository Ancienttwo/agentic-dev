#!/bin/bash
# Pre-Code Change Hook — PreToolUse on Edit|Write
# Warns when modifying asset layer files and slice contracts.

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/hook-input.sh"

FILE_PATH="$(hook_get_file_path "${1:-}")"
[[ -z "$FILE_PATH" ]] && exit 0

case "$FILE_PATH" in
  _ref/*)
    echo "[ExternalReference] _ref path detected: $FILE_PATH"
    echo "  _ref/ is external comparison material; refresh from upstream if needed, but keep it out of commits."
    ;;
  _ops/secrets/*|_ops/env/.env|_ops/env/.env.*)
    if [[ "$FILE_PATH" != "_ops/env/.env.example" ]]; then
      echo "[OpsSecret] Sensitive _ops path detected: $FILE_PATH"
      echo "  Keep keys, tokens, and local env values ignored; commit only examples, runbooks, submission docs, and scripts."
    fi
    ;;
  _ops/*)
    echo "[OpsAsset] Operations asset detected: $FILE_PATH"
    echo "  _ops/ is trackable for runbooks, submission materials, release checklists, and scripts."
    ;;
esac

if echo "$FILE_PATH" | grep -qE "(^|/)(interfaces|tests)(/|$)|(^|/)docs/spec\.md$|(^|/)specs/|(^|/)tasks/contracts/|(\.contract\.|\.spec\.)"; then
  echo "[AssetLayer] Immutable file detected: $FILE_PATH"
  echo "  资产层文件被修改，需同步重写下游实现。"
fi
