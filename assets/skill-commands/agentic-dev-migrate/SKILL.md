---
name: agentic-dev-migrate
description: Migrates older Claude/Codex workflow repos to the current tasks-first harness while preserving or archiving user-authored docs and hooks.
when_to_use: "agentic-dev-migrate, migrate legacy Claude repo, migrate docs/TODO.md, migrate docs/PROGRESS.md, upgrade old project-initializer repo, legacy workflow docs"
---

# agentic-dev-migrate

Use this command when inspection finds legacy workflow docs or stale harness artifacts.

## Protocol

1. Confirm the target repo path.
2. Run `bun scripts/inspect-project-state.ts --repo <repo> --format text`.
3. Dry-run legacy document migration with `bun scripts/migrate-workflow-docs.ts --repo <repo> --dry-run` when legacy docs exist.
4. Apply through `bash scripts/migrate-project-template.sh --repo <repo> --apply`.
5. Verify task workflow, migration report, and archived legacy content.

## Boundaries

- Preserve or archive user-authored content; never delete uncertain legacy docs directly.
- Remove only files marked `ownership=known_generated` by the workflow contract.
- Do not treat hooks as the only source of truth; the repo contract lives in repo files.
