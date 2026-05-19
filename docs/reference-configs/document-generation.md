# Document Generation

Generated repos use a minimal documentation profile by default.

## Required

- `docs/spec.md`: stable product or operator outcome.
- `docs/PROGRESS.md`: milestone ledger only.
- `tasks/`: execution, lessons, research, contracts, and reviews.
- `.ai/harness/`: workflow policy, checks, handoff, failures, and run state.

## On Demand

Create these only when the agent has concrete repo evidence or the user asks:

- `docs/brief.md`: product positioning and user scope.
- `docs/tech-stack.md`: confirmed runtime, framework, and dependency choices.
- `docs/decisions.md`: accepted architecture decisions with trade-offs.
- `docs/architecture.md`: current module boundaries and data flow.
- `docs/packages.md`: package inventory for real multi-package repos.

## Rules

- Do not create empty business docs as placeholders.
- Do not duplicate workflow rules already indexed in `docs/reference-configs/`.
- Prefer short docs that name sources, owners, and verification commands.
- Let functional-block `CLAUDE.md` and `AGENTS.md` carry local boundaries; root docs stay concise.
