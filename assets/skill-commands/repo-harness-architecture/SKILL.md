---
name: repo-harness-architecture
description: Resolves repo-harness architecture drift requests and updates architecture docs or diagrams without running full init, migrate, or upgrade.
when_to_use: "repo-harness-architecture, architecture drift, architecture doc, architecture diagram, update architecture index, resolve architecture request"
---

# repo-harness-architecture

Use this command when the harness already exists and the user wants a focused
architecture documentation, drift-request, or diagram pass.

## Protocol

1. Confirm the target repo path and architecture scope.
2. Inspect `docs/architecture/index.md` and pending files under `docs/architecture/requests/`.
3. When the scope maps to repo code or config, resolve the capability with:
   - `bun scripts/capability-resolver.ts match --repo <repo> --path <path> --format json`
4. Update the smallest relevant architecture artifact:
   - umbrella status in `docs/architecture/index.md`
   - module or snapshot docs under `docs/architecture/`
   - diagram artifact under `docs/architecture/diagrams/` when a visual flow materially helps
5. Use `diagram-design` for generated architecture diagrams; keep generated diagrams grounded in observed repo files.
6. Archive handled requests with:
   - `bash scripts/archive-architecture-request.sh --request <request> --status <resolved|superseded|rejected|no-change> --artifact <path> --note <text>`
7. Verify with:
   - `bun scripts/capability-resolver.ts validate --repo <repo> --format text`
   - `bash scripts/check-task-workflow.sh --strict` when repo workflow surfaces changed

## Boundaries

- Does not run `scripts/migrate-project-template.sh --apply`.
- Does not install or refresh the full harness.
- Does not let hooks rewrite architecture prose; hooks only record drift requests.
- Does not vendor `diagram-design`; it remains an external installed skill.
- Keeps `docs/architecture/requests/` pending-only by archiving handled requests.
