# Development Protocol (Reference)

This guide contains detailed protocol steps that do not need to stay in the always-loaded prompt.

## Source of Execution Truth

- Active execution lives in `tasks/todo.md`.
- Correction-derived prevention rules live in `tasks/lessons.md`.
- Deep investigation notes live in `tasks/research.md`.
- Hook ownership, failure logs, and parity expectations live in `docs/reference-configs/hook-operations.md`.

For any non-chat task that changes the repo in a substantive way, update `tasks/` as part of the same unit of work.

## Layer Model

- Immutable: `docs/spec.md`, `interfaces/`, `tests/`
- Mutable: `src/`

If immutable artifacts and implementation diverge, update immutable artifacts first.

## Feature Flow

1. Define acceptance criteria.
2. Update `docs/spec.md` or runtime interfaces when the boundary changed.
3. Add or update tests.
4. Update `tasks/todo.md` with the execution checklist.
5. Implement minimal change.
6. Verify and refactor.
7. Record evidence in `tasks/todo.md`.

## Bug Flow

1. Reproduce with test.
2. Fix root cause.
3. Re-run impacted checks.
4. Add prevention note to `tasks/lessons.md`.
5. Update `tasks/todo.md` with verification evidence if the repo changed.

## Final Response Rule

Every final delivery response should state:

1. What changed
2. What was verified
3. Which `tasks/*.md` files were updated
4. Remaining risks or follow-ups
