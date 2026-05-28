# Task Execution Checklist (Primary)

> **Source Plan**: plans/plan-20260528-1652-codegraph-readiness.md
> **Status**: Complete
> **Phase Progress**: CodeGraph dependency, detector, CLI `tools ensure codegraph`, doctor readiness check, and shell adapter parity are implemented; final verification is recorded in `tasks/reviews/codegraph-readiness.review.md`
> **Generated**: 2026-05-28 18:37
> **Source Plan Slug**: codegraph-readiness
> **Review File**: tasks/reviews/codegraph-readiness.review.md
> **Notes File**: tasks/notes/codegraph-readiness.notes.md
> **Capability ID**: verification-codegraph-readiness
> **Parent Run ID**: run-20260528T1758
> **Follows Merged Dependency**: plans/plan-20260528-1436-hook-global-runtime.md

## Execution

- [x] Materialize `tasks/contracts/codegraph-readiness.contract.md`, `tasks/notes/codegraph-readiness.notes.md`, and `tasks/reviews/codegraph-readiness.review.md`
- [x] Add `@colbymchenry/codegraph` as a self-host dev dependency and generate `bun.lock`
- [x] Add `scripts/ensure-codegraph.sh` and retire temporary `src/cli/tools/codegraph-runner.ts` after formal CLI registration
- [x] Add `src/cli/tools/codegraph.ts` facade for future CLI reuse
- [x] Update `scripts/check-agent-tooling.sh` to resolve CodeGraph local-first and report global drift/fallback
- [x] Keep generated downstream policy default explicit: no package dependency unless local policy opts in
- [x] Document self-host CodeGraph readiness and register the capability/architecture module
- [x] Verify read-only check paths do not run `bun install`, `codegraph init`, `codegraph sync`, or `codegraph install`
- [x] Repair the broad `bun test` gate so ignored `_ref/` checkouts do not enter repo-owned verification
- [x] Register `checkCodegraph()` and `ensureCodegraph()` on the merged `agentic-dev` CLI surface (`src/cli/index.ts`, `src/cli/commands/doctor.ts`, `src/cli/commands/tools.ts`)
- [x] Update `tasks/reviews/codegraph-readiness.review.md` to `Recommendation: pass` only after the full contract exit criteria pass

## Verification

```bash
bun test
bash scripts/check-deploy-sql-order.sh
bash scripts/check-task-sync.sh
bash scripts/check-task-workflow.sh --strict
bun scripts/inspect-project-state.ts --repo . --format text
bash scripts/migrate-project-template.sh --repo . --dry-run
bash scripts/ensure-codegraph.sh --check --json
bash scripts/check-agent-tooling.sh --host codex --strict-readiness --json
```
