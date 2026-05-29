# Sprint Contract: think-users-ancienttwo-agents-skillsthink-skill-md

> **Status**: Fulfilled
> **Plan**: plans/plan-20260530-0142-think-users-ancienttwo-agents-skillsthink-skill-md.md
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-05-30 02:23
> **Review File**: `tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md`
> **Notes File**: `tasks/notes/think-users-ancienttwo-agents-skillsthink-skill-md.notes.md`

## Goal

Implement host-aware external acceptance evidence for contract completion, without auto-running peer CLIs from hooks.

## Scope

- In scope: shared workflow-state external acceptance parser, review/release prompt text, done/finish gates, verify-sprint JSON evidence, generated templates/assets/docs parity, focused tests.
- Out of scope: daemon/job queue, database evidence store, host adapter JSON mutation, automatic `claude`/`codex` process execution from hooks.

## Workflow Inventory

- Source plan: `plans/plan-20260530-0142-think-users-ancienttwo-agents-skillsthink-skill-md.md`
- Deferred-goal ledger: `tasks/todo.md`
- Review file: `tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md`
- Notes file: `tasks/notes/think-users-ancienttwo-agents-skillsthink-skill-md.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - docs/spec.md
  - plans/
  - tasks/todo.md
  - tasks/contracts/think-users-ancienttwo-agents-skillsthink-skill-md.contract.md
  - tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md
  - tasks/notes/think-users-ancienttwo-agents-skillsthink-skill-md.notes.md
  - .ai/context/capabilities.json
  - .ai/hooks/
  - assets/hooks/
  - assets/reference-configs/
  - assets/templates/
  - docs/reference-configs/
  - scripts/
  - src/
  - tests/
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - docs/spec.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/think-users-ancienttwo-agents-skillsthink-skill-md.notes.md
  tests_pass:
    - path: tests/workflow-state-lib.test.ts
    - path: tests/hook-runtime.test.ts
    - path: tests/helper-scripts.test.ts
    - path: tests/hook-contracts.test.ts
    - path: tests/bootstrap-files.test.ts
  commands_succeed:
    - bun test tests/workflow-state-lib.test.ts tests/hook-runtime.test.ts tests/helper-scripts.test.ts tests/hook-contracts.test.ts tests/bootstrap-files.test.ts
  qa_scores:
    - dimension: functionality
      min: 8
```

## Acceptance Notes (Human Review)

- Functional behavior: Review/release intent prints a peer acceptance prompt; done/finish require pass/manual override; verify-sprint records parsed external acceptance status.
- Edge cases: Missing section, wrong reviewer/source, P1 blockers, manual override, and direct Codex shell host inference are covered.
- Regression risks: Older generated repos without refreshed workflow-state helpers degrade instead of hard-failing.

## Rollback Point

- Commit / checkpoint: branch commit for external acceptance gate.
- Revert strategy: revert the external acceptance gate commit and regenerated template/doc changes together.
