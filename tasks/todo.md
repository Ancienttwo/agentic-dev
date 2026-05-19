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
- [x] Added umbrella architecture drift requests and controlled local agent context contract sync hooks
- [x] Added explicit `.ai/context/capabilities.json` capability registry and longest-prefix resolver
- [x] Bound architecture drift, context contract sync, and workstream sync to capability IDs
- [x] Removed standalone `.ai/harness/workstreams/events.jsonl` in favor of `.ai/harness/events.jsonl`
- [x] Added capability registry validation to strict workflow checks
- [x] Renamed default runtime interface scaffold from `contracts/` to `interfaces/`
- [x] Deprecated default root `specs/` scaffold in favor of `docs/spec.md`, `interfaces/`, and tests
- [x] Deprecated `docs/PROGRESS.md` as a generated or required workflow surface; keep it as legacy migration input only
- [x] Clarified `tasks/notes/` as task-local decision notes in root `AGENTS.md` / `CLAUDE.md` and template partials
- [x] Updated `_ref/` and `_ops/` initialization, policy, gitignore, and hook guard rules
- [x] Added the `project-initializer` architecture diagram and linked it from the architecture index
