# Sprint Review: init-cli-external-skills

> **Status**: Complete
> **Plan**: plans/plan-20260528-1906-init-cli-external-skills.md
> **Contract**: tasks/contracts/init-cli-external-skills.contract.md
> **Notes File**: tasks/notes/init-cli-external-skills.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-05-28 20:05
> **Recommendation**: pass

## Mode Evidence

- Selected route: direct implementation and local verification.
- P1/P2/P3 evidence: recorded in the source plan and implementation notes.
- Root cause or plan evidence: the active todo lacked a real source plan while the CLI init slice already had implementation notes and changed files.

## Verification Evidence

- Commands run:
  - `bun test tests/cli/init.test.ts tests/installed-copy-sync.test.ts tests/workflow-contract.test.ts tests/migration-script.test.ts tests/skill-version.test.ts tests/run-skill-evals.test.ts`
  - `bun test tests/cli/init.test.ts tests/readme-dx.test.ts`
  - `bun test`
  - `bash scripts/check-deploy-sql-order.sh`
  - `bash scripts/check-task-sync.sh`
  - `bash scripts/check-task-workflow.sh --strict`
  - `bun scripts/inspect-project-state.ts --repo . --format text`
  - `bash scripts/migrate-project-template.sh --repo . --dry-run`
  - `bun src/cli/index.ts init --target codex`
- Manual checks:
  - README DX contract now targets `agentic-dev init --dry-run`.
  - Active plan/todo markers were aligned with this init CLI slice.
  - `~/.codex/skills/project-initializer` and `~/.claude/skills/project-initializer` are absent after installed-copy sync.
  - `~/.codex/skills/check`, `~/.codex/skills/health`, and `~/.codex/skills/diagram-design` are present.
- Supporting artifacts:
  - `tasks/notes/init-cli-external-skills.notes.md`
  - `tasks/todo.md`
  - `.ai/harness/checks/latest.json`
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/`

## Behavior Diff Notes

- `agentic-dev init` becomes the first-run existing-repo command.
- `project-initializer` installed aliases are cleanup targets rather than maintained compatibility roots.
- Self-init also refreshed generated runtime adapter/context surfaces under `.ai/` and `.codex/`.

## Residual Risks / Follow-ups

- The first local init attempt failed only at Waza install because npm had a stale `_npx` cache rename conflict (`ENOTEMPTY`). Rerunning with an isolated npm cache succeeded; no repo code change was needed.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Init covers cwd default, host adapters, Waza, diagram-design, harness apply, and verification |
| Product depth | 8/10 | First-run docs and skill routing now match operator behavior |
| Design quality | 8/10 | Init orchestrates existing primitives and dry-run avoids host mutations |
| Code quality | 9/10 | CLI and migration behavior are covered by targeted and full test gates |

## Failing Items

- None.

## Retest Steps

- Re-run root required checks from `AGENTS.md` before release tagging.

## Summary

- `agentic-dev init` is implemented and verified, retired installed aliases are removed locally, and Codex runtime initialization succeeded.
