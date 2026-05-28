# Architecture Drift Request: 20260529-000322-root-package-json

> **Status**: Pending
> **Detected**: 2026-05-29T00:03:22+0800
> **Severity**: medium
> **Change Type**: boundary-or-config
> **File**: `package.json`
> **Functional Block**: `root`
> **Capability ID**: `root`
> **Matched Prefix**: `root`
> **Architecture Domain**: `root`
> **Architecture Capability**: `_root`
> **Architecture Module**: `docs/architecture/index.md`
> **Workstream Directory**: `tasks/workstreams/root/_root`
> **Contract Files**: `none`, `none`
> **Contract Sync Required**: false
> **Spawn Recommended**: false

## Required Follow-up

- Read root `AGENTS.md` / `CLAUDE.md`.
- If functional block is not `root`, read its local `AGENTS.md` / `CLAUDE.md`.
- Decide whether this change affects module boundaries, entrypoints, dependency rules, runtime paths, or verification commands.
- For substantial changes, write a snapshot under `docs/architecture/snapshots/`.
- When a visual explains the boundary better than prose, generate one standalone `$diagram-design` architecture HTML file under `docs/architecture/diagrams/`.
- Treat `diagram-design` as an external installed skill dependency at `~/.codex/skills/diagram-design`; do not copy, vendor, or inline its templates into this repo.
- If this starts or advances durable execution, run `scripts/workstream-sync.sh ensure --block "root" --request "docs/architecture/requests/20260529-000322-root-package-json.md"`.
- After the snapshot or diagram is produced, run `scripts/context-contract-sync.sh sync-latest` so the local architecture contract block links to the latest artifacts.

## Event Fields

```json
{
  "ts": "2026-05-29T00:03:22+0800",
  "file_path": "package.json",
  "severity": "medium",
  "functional_block": "root",
  "capability_id": "root",
  "matched_prefix": "root",
  "architecture_domain": "root",
  "architecture_capability": "_root",
  "architecture_module": "docs/architecture/index.md",
  "workstream_dir": "tasks/workstreams/root/_root",
  "contract_agents": "",
  "contract_claude": "",
  "change_type": "boundary-or-config",
  "request_file": "docs/architecture/requests/20260529-000322-root-package-json.md",
  "spawn_recommended": false,
  "contract_sync_required": false
}
```
