#!/bin/bash
# Pre-Code Change Hook — PreToolUse on Edit|Write
# Warns when modifying asset layer files (interfaces, specs, tests) and slice contracts.

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/hook-input.sh"

FILE_PATH="$(hook_get_file_path "${1:-}")"
[[ -z "$FILE_PATH" ]] && exit 0

if echo "$FILE_PATH" | grep -qE "(^|/)(interfaces|specs|tests)(/|$)|(^|/)tasks/contracts/|(\.contract\.|\.spec\.)"; then
  echo "[AssetLayer] Immutable file detected: $FILE_PATH"
  echo "  资产层文件被修改，需同步重写下游实现。"
fi
