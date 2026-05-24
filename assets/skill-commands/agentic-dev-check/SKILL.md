---
name: agentic-dev-check
description: Verification entrypoint for agentic-dev workflow readiness. Runs workflow gates, task sync, contract checks, inspector, and migration dry-run before merge or release.
when_to_use: "agentic-dev-check, check agentic workflow, verify harness, pre-merge workflow check, release readiness, validate tasks-first contract"
---

# agentic-dev-check

Use this command when the user asks whether the harness, migration, or release surface is ready.

## Protocol

1. Confirm the repo path and report dirty-worktree boundaries.
2. Run the repo-local required checks that exist:
   - `bun test`
   - `bash scripts/check-deploy-sql-order.sh`
   - `bash scripts/check-task-sync.sh`
   - `bash scripts/check-task-workflow.sh --strict`
   - `bun scripts/inspect-project-state.ts --repo . --format text`
   - `bash scripts/migrate-project-template.sh --repo . --dry-run`
3. Summarize pass/fail evidence and the next blocking command if any.

## Boundaries

- Does not mutate repo files by default.
- Does not silently ignore advisory tooling hangs or skipped checks.
- Does not claim release readiness if source repo and installed runtime copy are out of sync.
