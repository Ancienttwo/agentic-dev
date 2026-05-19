# project-initializer CLAUDE.md

This repository dogfoods the `project-initializer` workflow. Treat it as a Bun + TypeScript skill/tooling repo whose job is to generate, migrate, and validate tasks-first AI project scaffolding for Claude and Codex.

## Read First

- `tasks/todo.md`
- `tasks/lessons.md`

## Load On Demand

- `tasks/research.md` for codebase findings and migration quirks
- `plans/` for any active implementation plan
- `.ai/harness/workflow-contract.json`
- `.ai/harness/policy.json`
- `.ai/context/context-map.json`
- `docs/reference-configs/agentic-development-flow.md`
- `docs/reference-configs/ai-workflows.md`
- `docs/reference-configs/development-protocol.md`
- `docs/reference-configs/workflow-orchestration.md`

## Repo-Specific Rules

- Keep this file concise; route detailed policy into `docs/reference-configs/`.
- Treat `.ai/hooks/` as the shared automation layer and `.claude/settings.json` as the Claude adapter.
- Route product discovery to gstack `office-hours`, complex engineering plans to gstack `plan-eng-review`, design plans to gstack `plan-design-review`, and daily small/medium planning, bug hunts, and checks to Waza `/think`, `/hunt`, and `/check`.
- Route knowledge sync and handoff retrieval to `gbrain`.
- Treat Waza as Codex-first: `~/.codex/skills` is the Codex runtime source; `~/.agents/skills` is skills CLI staging/cache only. Update by staging upstream Waza, copying the eight managed `SKILL.md` files into Codex, and verifying with `cmp`.
- Use `docs/reference-configs/agentic-development-flow.md` for routing details and `docs/reference-configs/external-tooling.md` plus `bash scripts/check-agent-tooling.sh --host both --check-updates` for advisory install/update guidance.
- When changing bootstrap or migration behavior, update the matching tests in `tests/`.
- Prefer additive migration behavior over destructive replacement.
- Preserve the distinction between milestone tracking in `docs/PROGRESS.md` and active work tracking in `tasks/`.
- Keep `assets/workflow-contract.v1.json` and `.ai/harness/workflow-contract.json` aligned.
- Treat Codex auto-compact as a fallback only; long-task rollover belongs in `.ai/harness/handoff/current.md` and `.ai/harness/handoff/resume.md`.
- If current repo state conflicts with the task, open an isolated `codex/<task-slug>` worktree, finish there, run Waza `/check`-style validation, then merge back to `main` without absorbing unrelated dirty changes.

## Verification Defaults

Run these when touching scaffolding, migration, hooks, or workflow contracts:

```bash
bun test
bash scripts/check-task-sync.sh
bash scripts/check-task-workflow.sh --strict
bun scripts/inspect-project-state.ts --repo . --format text
bash scripts/migrate-project-template.sh --repo . --dry-run
```
