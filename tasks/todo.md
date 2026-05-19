# Task Execution Checklist (Primary)

> **Source Plan**: (none)
> **Status**: Idle
> Generate the next execution checklist from an approved plan with:
>   bash scripts/plan-to-todo.sh --plan plans/plan-YYYYMMDD-HHMM-slug.md

## Execution
- [x] Added selector-hooked functional-block context selection for paired `CLAUDE.md` and `AGENTS.md`
- [x] Removed implicit `apps/*`, `packages/*`, and `services/*` agent-context generation
- [x] Added `minimal-agentic` documentation profile with explicit full-doc opt-in
- [x] Added lightweight `lsp_profiles` metadata for selected functional blocks
- [x] Added conflict-triggered Codex worktree policy with Waza `/check` validation and merge-back requirements
- [x] Run workflow and regression checks for scaffold, migration, self-host parity, and Waza-style review
