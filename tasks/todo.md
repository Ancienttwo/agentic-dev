# Task Execution Checklist (Primary)

> **Source Plan**: plans/plan-20260528-1906-init-cli-external-skills.md
> **Status**: Complete
> **Phase Progress**: `agentic-dev init` is implemented, `project-initializer` installed aliases are retired, required checks pass, and Codex local runtime init succeeded.
> **Generated**: 2026-05-28 19:06
> **Source Plan Slug**: init-cli-external-skills
> **Notes File**: tasks/notes/init-cli-external-skills.notes.md
> **Capability ID**: public-surface-root-router

## Execution

- [x] Add `agentic-dev init` to the CLI and default the target repo to cwd when `--repo` is omitted.
- [x] Make init refresh installed `agentic-dev` aliases, install host adapters, apply the harness, bootstrap Waza plus `diagram-design`, and verify the target repo.
- [x] Stop maintaining `~/.codex/skills/project-initializer` and `~/.claude/skills/project-initializer`; remove them during installed-copy sync.
- [x] Remove `project-initializer` upstream lookup fallbacks from generated helper resolution.
- [x] Update user-facing docs, architecture notes, version stamp wording, and tests for the retired alias.
- [x] Run targeted tests and full required checks.
- [x] Run installed-copy sync and `agentic-dev init --target codex` on this machine.
- [ ] Commit the local update.

## Verification

```bash
bun test tests/cli/init.test.ts tests/installed-copy-sync.test.ts tests/workflow-contract.test.ts tests/migration-script.test.ts tests/skill-version.test.ts tests/run-skill-evals.test.ts
bun test
bash scripts/check-deploy-sql-order.sh
bash scripts/check-task-sync.sh
bash scripts/check-task-workflow.sh --strict
bun scripts/inspect-project-state.ts --repo . --format text
bash scripts/migrate-project-template.sh --repo . --dry-run
```

## Evidence

- `bun test`: 421 pass, 6 skip, 0 fail.
- `bash scripts/check-deploy-sql-order.sh`: OK.
- `bash scripts/check-task-sync.sh`: OK.
- `bash scripts/check-task-workflow.sh --strict`: OK.
- `bun scripts/inspect-project-state.ts --repo . --format text`: `mode: audit`, no drift signals.
- `bash scripts/migrate-project-template.sh --repo . --dry-run`: OK.
- `bun src/cli/index.ts init --target codex`: OK after rerun with an isolated npm cache because the first `npx` attempt hit an `ENOTEMPTY` cache rename under `~/.npm-cache/_npx`.
