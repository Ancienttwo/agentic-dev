#!/bin/bash
set -euo pipefail

usage() {
  cat <<'USAGE_EOF'
Usage:
  scripts/architecture-drift.sh record --file <path>
USAGE_EOF
}

repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
repo="$(cd "$repo" && pwd)"
cd "$repo"

command_name="${1:-record}"
shift || true

file_path=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      [[ -n "${2:-}" ]] || { echo "architecture-drift: --file requires a value" >&2; exit 2; }
      file_path="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "architecture-drift: unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ "$command_name" != "record" ]]; then
  echo "architecture-drift: unknown command: $command_name" >&2
  usage
  exit 2
fi

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "$value"
}

safe_token() {
  local value="$1"
  value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
  value="$(printf '%s' "$value" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
  printf '%s' "${value:-root}"
}

json_get() {
  local json_input="$1"
  local key="$2"
  local parsed=""

  if [[ -z "$json_input" ]]; then
    return 1
  fi

  if command -v jq >/dev/null 2>&1; then
    parsed="$(printf '%s' "$json_input" | jq -r ".$key // empty" 2>/dev/null || true)"
  fi

  if [[ -z "$parsed" ]] && command -v node >/dev/null 2>&1; then
    parsed="$(JSON_INPUT="$json_input" JSON_KEY="$key" node -e '
const raw = process.env.JSON_INPUT || "";
const key = process.env.JSON_KEY || "";
try {
  const value = JSON.parse(raw)[key];
  if (value === undefined || value === null) process.exit(1);
  process.stdout.write(String(value));
} catch {
  process.exit(1);
}
' 2>/dev/null || true)"
  fi

  [[ -n "$parsed" ]] || return 1
  printf '%s' "$parsed"
}

derive_scope() {
  local block="$1"
  local block_slug
  local domain_slug
  local capability_slug
  local last_index

  block_slug="$(safe_token "$block")"
  domain_slug="$block_slug"
  capability_slug="_domain"

  IFS='/' read -r -a parts <<< "$block"
  if [[ "${#parts[@]}" -ge 2 ]]; then
    domain_slug="$(safe_token "${parts[0]}-${parts[1]}")"
  fi
  if [[ "${#parts[@]}" -gt 2 ]]; then
    last_index=$((${#parts[@]} - 1))
    capability_slug="$(safe_token "${parts[$last_index]}")"
  fi

  printf '%s\n%s\n' "$domain_slug" "$capability_slug"
}

repo_relative_path() {
  local value="$1"
  value="${value#file://}"
  case "$value" in
    "$repo"/*)
      value="${value#$repo/}"
      ;;
    /*)
      return 1
      ;;
    ./*)
      value="${value#./}"
      ;;
  esac

  case "$value" in
    ""|.|..|../*|*/../*|*$'\n'*|*$'\r'*)
      return 1
      ;;
  esac

  printf '%s' "$value"
}

selected_blocks() {
  if [[ -x "scripts/select-agent-context-blocks.sh" ]]; then
    "scripts/select-agent-context-blocks.sh" "$repo" 2>/dev/null || true
    return 0
  fi

  find "$repo" \
    \( -path "$repo/.git" -o -path "$repo/node_modules" -o -path "$repo/.ai" -o -path "$repo/.claude" \) -prune -o \
    \( -type f \( -name 'CLAUDE.md' -o -name 'AGENTS.md' \) \) -print 2>/dev/null | while IFS= read -r context_file; do
      context_dir="$(dirname "$context_file")"
      rel_dir="${context_dir#$repo/}"
      [[ "$rel_dir" == "$context_dir" || "$rel_dir" == "." ]] && continue
      printf '%s\n' "$rel_dir"
    done | sort -u
}

match_functional_block() {
  local rel_path="$1"
  local best="root"
  local block

  while IFS= read -r block; do
    [[ -n "$block" ]] || continue
    block="${block#./}"
    block="${block%/}"
    [[ -z "$block" || "$block" == "." ]] && continue
    case "$block" in
      /*|../*|*/../*|*\"*)
        continue
        ;;
    esac

    if [[ "$rel_path" == "$block" || "$rel_path" == "$block/"* ]]; then
      if [[ "$best" == "root" || "${#block}" -gt "${#best}" ]]; then
        best="$block"
      fi
    fi
  done < <(selected_blocks)

  printf '%s' "$best"
}

classify_change() {
  local rel_path="$1"
  local base
  base="$(basename "$rel_path")"

  case "$rel_path" in
    .git/*|node_modules/*|.ai/harness/architecture/*|docs/architecture/*|.claude/.trace.jsonl)
      printf 'none internal\n'
      return
      ;;
    CLAUDE.md|AGENTS.md|*/CLAUDE.md|*/AGENTS.md)
      printf 'none agent-context\n'
      return
      ;;
  esac

  if [[ "$rel_path" =~ ^(\.ai/hooks/|assets/hooks/) ]] ||
     [[ "$rel_path" == ".ai/harness/policy.json" ]] ||
     [[ "$rel_path" == ".ai/harness/workflow-contract.json" ]] ||
     [[ "$rel_path" == "assets/workflow-contract.v1.json" ]] ||
     [[ "$rel_path" =~ ^scripts/(architecture-drift|context-contract-sync|workstream-sync|migrate-project-template|migrate-workflow-docs|inspect-project-state|check-skill-version|capability-resolver|capability-config|create-project-dirs|init-project|ensure-task-workflow|check-task-workflow|check-deploy-sql-order|workflow-contract|select-agent-context-blocks)\.(sh|ts)$ ]] ||
     [[ "$rel_path" == "scripts/lib/project-init-lib.sh" ]]; then
    printf 'high workflow-surface\n'
    return
  fi

  if [[ "$rel_path" =~ (^|/)(migrations|migration|schema|schemas|database|db|infra|terraform|k8s)(/|$) ]] ||
     [[ "$base" =~ ^wrangler.*\.toml$ ]] ||
     [[ "$base" =~ ^(Dockerfile|docker-compose\.ya?ml|schema\.prisma)$ ]]; then
    printf 'high data-or-deploy\n'
    return
  fi

  if [[ "$rel_path" =~ ^(apps|packages|services)/[^/]+/(package\.json|tsconfig\.json|metro\.config\.(js|ts)|vite\.config\.(js|ts)|next\.config\.(js|mjs|ts)|app\.json|app\.config\.(js|ts))$ ]] ||
     [[ "$rel_path" =~ ^(apps|packages|services)/[^/]+/src/(routes|api|server|app)(/|$) ]] ||
     [[ "$rel_path" =~ ^packages/[^/]+/src/[^/]+/index\.ts$ ]] ||
     [[ "$rel_path" =~ ^(package\.json|turbo\.json|tsconfig\.json|pnpm-workspace\.yaml|bunfig\.toml)$ ]]; then
    printf 'medium boundary-or-config\n'
    return
  fi

  if [[ "$rel_path" =~ ^(apps|packages|services)/[^/]+/src/ ]]; then
    printf 'low source-change\n'
    return
  fi

  printf 'none unrelated\n'
}

if [[ -z "$file_path" ]]; then
  echo "architecture-drift: missing --file" >&2
  exit 2
fi

rel_path="$(repo_relative_path "$file_path" || true)"
if [[ -z "$rel_path" ]]; then
  echo "[ArchitectureDrift] Skipped unsafe path: $file_path"
  exit 0
fi

read -r severity change_type < <(classify_change "$rel_path")
if [[ "$severity" == "none" ]]; then
  echo "[ArchitectureDrift] No architecture drift request for $rel_path ($change_type)."
  exit 0
fi

capability_match=""
if [[ -f "scripts/capability-resolver.ts" ]] && command -v bun >/dev/null 2>&1; then
  if ! capability_match="$(bun scripts/capability-resolver.ts match --path "$rel_path" --format json 2>&1)"; then
    echo "$capability_match" >&2
    exit 1
  fi
fi

functional_block="root"
matched_prefix="root"
capability_id="root"
contract_agents=""
contract_claude=""
if [[ -n "$capability_match" ]] && [[ "$(json_get "$capability_match" "matched" || true)" == "true" ]]; then
  functional_block="$(json_get "$capability_match" "functional_block")"
  matched_prefix="$(json_get "$capability_match" "matched_prefix")"
  capability_id="$(json_get "$capability_match" "capability_id")"
fi
timestamp="$(date '+%Y%m%d-%H%M%S')"
iso_timestamp="$(date '+%Y-%m-%dT%H:%M:%S%z')"
block_slug="$(safe_token "$functional_block")"
path_slug="$(safe_token "$rel_path")"
architecture_domain="root"
architecture_capability="_root"
architecture_module="docs/architecture/index.md"
workstream_dir="tasks/workstreams/root/_root"
request_slug="${timestamp}-${block_slug}-${path_slug}"
request_file="docs/architecture/requests/${request_slug}.md"
index_file="docs/architecture/index.md"
event_file=".ai/harness/architecture/events.jsonl"
spawn_recommended="false"
contract_sync_required="false"

if [[ "$severity" == "high" ]]; then
  spawn_recommended="true"
fi

if [[ "$functional_block" != "root" && ( "$severity" == "high" || "$severity" == "medium" ) ]]; then
  contract_sync_required="true"
fi

if [[ "$functional_block" != "root" ]]; then
  architecture_domain="$(json_get "$capability_match" "architecture_domain")"
  architecture_capability="$(json_get "$capability_match" "architecture_capability")"
  architecture_module="$(json_get "$capability_match" "architecture_module")"
  workstream_dir="$(json_get "$capability_match" "workstream_dir")"
  contract_agents="$(json_get "$capability_match" "contract_agents" || true)"
  contract_claude="$(json_get "$capability_match" "contract_claude" || true)"
fi

mkdir -p docs/architecture/requests docs/architecture/snapshots docs/architecture/diagrams docs/architecture/domains docs/architecture/modules .ai/harness/architecture tasks/workstreams

if [[ ! -f "$index_file" ]]; then
  cat > "$index_file" <<'INDEX_EOF'
# Architecture Index

> Umbrella architecture ledger for current boundaries, drift requests, snapshots, and diagrams.

## Current Snapshot

- Latest snapshot: (none yet)
- Latest diagram: (none yet)

## Pending Requests

INDEX_EOF
fi

cat > "$request_file" <<EOF_REQUEST
# Architecture Drift Request: ${request_slug}

> **Status**: Pending
> **Detected**: ${iso_timestamp}
> **Severity**: ${severity}
> **Change Type**: ${change_type}
> **File**: \`${rel_path}\`
> **Functional Block**: \`${functional_block}\`
> **Capability ID**: \`${capability_id}\`
> **Matched Prefix**: \`${matched_prefix}\`
> **Architecture Domain**: \`${architecture_domain}\`
> **Architecture Capability**: \`${architecture_capability}\`
> **Architecture Module**: \`${architecture_module}\`
> **Workstream Directory**: \`${workstream_dir}\`
> **Contract Files**: \`${contract_agents:-none}\`, \`${contract_claude:-none}\`
> **Contract Sync Required**: ${contract_sync_required}
> **Spawn Recommended**: ${spawn_recommended}

## Required Follow-up

- Read root \`AGENTS.md\` / \`CLAUDE.md\`.
- If functional block is not \`root\`, read its local \`AGENTS.md\` / \`CLAUDE.md\`.
- Decide whether this change affects module boundaries, entrypoints, dependency rules, runtime paths, or verification commands.
- For substantial changes, write a snapshot under \`docs/architecture/snapshots/\`.
- When a visual explains the boundary better than prose, generate one standalone \`\$diagram-design\` architecture HTML file under \`docs/architecture/diagrams/\`.
- Treat \`diagram-design\` as an external installed skill dependency at \`~/.codex/skills/diagram-design\`; do not copy, vendor, or inline its templates into this repo.
- If this starts or advances durable execution, run \`scripts/workstream-sync.sh ensure --block "${functional_block}" --request "${request_file}"\`.
- After the snapshot or diagram is produced, run \`scripts/context-contract-sync.sh sync-latest\` so the local architecture contract block links to the latest artifacts.

## Event Fields

\`\`\`json
{
  "file_path": "$(json_escape "$rel_path")",
  "severity": "$(json_escape "$severity")",
  "functional_block": "$(json_escape "$functional_block")",
  "capability_id": "$(json_escape "$capability_id")",
  "matched_prefix": "$(json_escape "$matched_prefix")",
  "architecture_domain": "$(json_escape "$architecture_domain")",
  "architecture_capability": "$(json_escape "$architecture_capability")",
  "architecture_module": "$(json_escape "$architecture_module")",
  "workstream_dir": "$(json_escape "$workstream_dir")",
  "contract_agents": "$(json_escape "$contract_agents")",
  "contract_claude": "$(json_escape "$contract_claude")",
  "change_type": "$(json_escape "$change_type")",
  "spawn_recommended": ${spawn_recommended},
  "contract_sync_required": ${contract_sync_required}
}
\`\`\`
EOF_REQUEST

pending_line="- [ ] ${iso_timestamp} [${severity}] \`${rel_path}\` -> [${request_slug}](requests/${request_slug}.md)"
if ! grep -Fq "$request_file" "$index_file" 2>/dev/null && ! grep -Fq "requests/${request_slug}.md" "$index_file" 2>/dev/null; then
  printf '%s\n' "$pending_line" >> "$index_file"
fi

event_json="$(printf '{"ts":"%s","file_path":"%s","severity":"%s","functional_block":"%s","capability_id":"%s","matched_prefix":"%s","architecture_domain":"%s","architecture_capability":"%s","architecture_module":"%s","workstream_dir":"%s","contract_agents":"%s","contract_claude":"%s","change_type":"%s","request_file":"%s","spawn_recommended":%s,"contract_sync_required":%s}\n' \
  "$(json_escape "$iso_timestamp")" \
  "$(json_escape "$rel_path")" \
  "$(json_escape "$severity")" \
  "$(json_escape "$functional_block")" \
  "$(json_escape "$capability_id")" \
  "$(json_escape "$matched_prefix")" \
  "$(json_escape "$architecture_domain")" \
  "$(json_escape "$architecture_capability")" \
  "$(json_escape "$architecture_module")" \
  "$(json_escape "$workstream_dir")" \
  "$(json_escape "$contract_agents")" \
  "$(json_escape "$contract_claude")" \
  "$(json_escape "$change_type")" \
  "$(json_escape "$request_file")" \
  "$spawn_recommended" \
  "$contract_sync_required")"
printf '%s' "$event_json" >> "$event_file"

echo "[ArchitectureDrift] Request: $request_file"
echo "[ArchitectureDrift] Event: $event_file"
echo "[ArchitectureDrift] severity=$severity capability_id=$capability_id functional_block=$functional_block spawn_recommended=$spawn_recommended contract_sync_required=$contract_sync_required"
