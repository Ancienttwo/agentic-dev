# Document Generation

Generated repos use a minimal documentation profile by default.

## Required

- `docs/spec.md`: stable product or operator outcome.
- `docs/architecture/index.md`: umbrella architecture ledger, pending drift requests, snapshots, and diagram links.
- `tasks/`: execution, lessons, research, contracts, and reviews.
- `tasks/workstreams/`: durable capability workstream ledgers; `tasks/todo.md` is only the current session projection.
- `.ai/harness/`: workflow policy, checks, handoff, failures, and run state.

## On Demand

Create these only when the agent has concrete repo evidence or the user asks:

- `docs/brief.md`: product positioning and user scope.
- `docs/tech-stack.md`: confirmed runtime, framework, and dependency choices.
- `docs/decisions.md`: accepted architecture decisions with trade-offs.
- `docs/architecture/snapshots/*.md`: current module boundaries and data flow for architecture-sensitive changes.
- `docs/architecture/diagrams/*.html`: self-contained architecture diagrams produced by agents when a visual is clearer than prose.
- `docs/packages.md`: package inventory for real multi-package repos.

## Rules

- Do not create empty business docs as placeholders.
- Do not create root `specs/`; use `docs/spec.md` for stable product intent, `interfaces/` for machine-consumed runtime boundaries, and tests for executable behavior.
- Do not duplicate workflow rules already indexed in `docs/reference-configs/`.
- Prefer short docs that name sources, owners, and verification commands.
- Let capability `CLAUDE.md` and `AGENTS.md` carry local contract projections; root docs stay concise.
- Keep complete workstream TODOs in `tasks/workstreams/<domain>/<capability>/`; contract blocks should link to them instead of becoming task logs.
- Hooks may create `docs/architecture/requests/*.md`; agents own semantic snapshots and `diagram-design` HTML output.
- Treat `diagram-design` as an external installed skill dependency at `~/.codex/skills/diagram-design`; do not copy or inline its assets into generated repos.
