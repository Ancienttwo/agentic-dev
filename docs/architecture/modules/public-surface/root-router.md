# Architecture Module: public-surface/root-router

> **Capability ID**: `public-surface-root-router`
> **Matched Prefixes**: `SKILL.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/spec.md`
> **Local Contracts**: `AGENTS.md`, `CLAUDE.md`

## P1 Map

The root router is the human and agent entrypoint for this plugin. `SKILL.md`
defines when the skill is used, compatibility aliases, and the four core paths:
initialize, migrate, audit, and repair. `README.md` owns first-run operator
guidance. `AGENTS.md` and `CLAUDE.md` define the self-hosted repo workflow for
both Codex and Claude. `docs/spec.md` owns the stable product outcome.

Strong dependencies:

- `scripts/inspect-project-state.ts` for state classification.
- `assets/workflow-contract.v1.json` for the machine-readable contract.
- `docs/reference-configs/agentic-development-flow.md` for routing detail that should not bloat root docs.

Weak dependencies:

- Compatibility name `agentic-dev-skill`.
- Retired `project-initializer` install paths, which are cleanup targets only.
- `agentic-dev init` owns the one-shot Codex/Claude runtime bootstrap for Waza and `diagram-design`.
- gstack/gbrain policy references remain advisory; this self-host repo vendors CodeGraph as a dev dependency while downstream generated repos keep global MCP setup explicit unless policy opts in.

Out of scope:

- Runtime hook implementation.
- Migration internals.
- Product scaffold details after initial harness attachment.

## P2 Trace

Concrete route: user asks for an existing repo install -> root `SKILL.md`
selects `agentic-dev-init` semantics -> `agentic-dev init` defaults the target
repo to cwd unless `--repo` is supplied -> the command runs
`inspect-project-state.ts --repo <repo> --format text` -> if no legacy state is
found, `migrate-project-template.sh --repo <repo> --apply` installs or refreshes
the workflow -> Waza and `diagram-design` are bootstrapped for the selected
host target -> `check-task-workflow.sh --strict` verifies the target repo.

Input source of truth is the target repo path, not the user's wording. The first
type transformation is repo filesystem state into `mode`, `legacy_contract_version`,
`drift_signals`, `required_decisions`, and `upgrade_plan`. The final output is a
file-backed harness plus verification report.

Error paths:

- Missing cwd/repo path stops before mutation.
- Legacy docs route to migration before template refresh.
- Missing JSON runtime fails strict workflow verification.

## P3 Decision

The root router is intentionally thin because the workflow has too many
machine-checked invariants to keep correct in prose. The invariant is that
policy lives in contracts, scripts, and tests; root docs only route and orient.

At 10x command count, this layer would fail first through discoverability and
duplicate wording. The current action-command split keeps root `SKILL.md`
stable while letting new public commands stay independently reviewable.

## Optimization Backlog

- Keep root `SKILL.md` under the existing line budget.
- If another public command is added, update `assets/skill-commands/manifest.json`, README, and `tests/action-command-skills.test.ts` in the same slice.
