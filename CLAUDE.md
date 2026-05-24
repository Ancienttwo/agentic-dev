# agentic-dev CLAUDE.md

This repository self-hosts the `agentic-dev` contract, formerly `agentic-dev-skill` and `project-initializer`. Claude and Codex should follow the same repo-local workflow surface.

## Canonical Workflow Files

- `tasks/todo.md` for the current execution checklist and verification notes
- `.ai/context/capabilities.json` for the capability registry and longest-prefix context boundaries
- `tasks/workstreams/` for capability long-running workstreams that project the current slice into `tasks/todo.md`
- `tasks/lessons.md` for correction-derived rules
- `tasks/research.md` for deep repo knowledge
- `tasks/notes/` for task-local implementation decisions, deviations, tradeoffs, and open questions
- `plans/` for timestamped plans, with `plans/archive/` for history
- `.ai/harness/workflow-contract.json` for the installed workflow contract manifest
- `.ai/harness/policy.json` for the machine-readable workflow contract
- `.ai/context/context-map.json` for progressive context loading
- `docs/architecture/index.md` for umbrella architecture status, drift requests, snapshots, and diagram links
- `docs/reference-configs/agentic-development-flow.md` for gstack/Waza routing rules

## Operating Rules

- Sync `tasks/` whenever substantive repo changes are made.
- Use `tasks/notes/<slug>.notes.md` only for non-obvious slice decisions, deviations, tradeoffs, and open questions; do not use notes as durable memory or a task log, and archive/promote them deliberately when the slice closes.
- Treat `.ai/hooks/` as the shared hook implementation and `.claude/settings.json` as the Claude adapter only.
- Keep the umbrella hierarchy explicit: architecture owns stable truth, capability contracts own local agent context, `tasks/workstreams/<domain>/<capability>/` owns durable progress, and `tasks/todo.md` owns only the current session slice.
- Treat `.ai/context/capabilities.json` as the source of truth for capability prefixes; `agent-context-blocks.txt` and nested agent files are compatibility inputs only.
- Keep architecture drift handling split: `architecture-drift.sh` writes architecture requests/events, `workstream-sync.sh` maintains durable capability workstreams, and `context-contract-sync.sh` only updates controlled local `CLAUDE.md`/`AGENTS.md` architecture blocks.
- Keep `assets/workflow-contract.v1.json` and `.ai/harness/workflow-contract.json` in sync.
- Keep `CLAUDE.md` and `AGENTS.md` short; put detailed guidance in `docs/reference-configs/`.
- Treat Codex auto-compact as a fallback only; use `.ai/harness/handoff/current.md` and `.ai/harness/handoff/resume.md` for long-task rollover.
- Treat `_ref/` as an occasional ignored external reference checkout cache, not a commit surface or daily workflow. Agents may read or refresh it for comparison; when it influences a decision, cite the source repo plus commit/tag and path in `tasks/notes/` or `tasks/research.md`.
- Treat `deploy/` as the trackable deployment and operations surface for runbooks, submission materials, release checklists, helper scripts, ordered SQL files under `deploy/sql/`, and env examples.
- Treat `_ops/` as ignored local operations state for secrets, real env files, provider state, artifacts, logs, and scratch files; do not commit or agent-edit `_ops/*`.
- Treat contract-level task execution as worktree-first: `scripts/plan-to-todo.sh --plan <approved-plan>` starts `scripts/contract-worktree.sh start --plan <approved-plan>` when policy enables it, and completed blocks finish through Waza `/check` plus `scripts/contract-worktree.sh finish`.
- If current repo state conflicts with the task, open an isolated `codex/<task-slug>` worktree, finish there, run Waza `/check`-style validation, then merge back to `main` without absorbing unrelated dirty changes.
- Route product discovery to gstack `office-hours`, complex engineering plans to gstack `plan-eng-review`, design plans to gstack `plan-design-review`, and daily small/medium planning, bug hunts, and checks to Waza `/think`, `/hunt`, and `/check`.
- Codex automation profile is runtime-referenced, not vendored: required skills are `health`, `check`, and `diagram-design` from `~/.codex/skills`.
- Route knowledge sync and handoff retrieval to `gbrain`.
- Treat Waza as Codex-first: `~/.codex/skills` is the Codex runtime source; `~/.agents/skills` is skills CLI staging/cache only. Update by staging upstream Waza, copying the eight managed `SKILL.md` files into Codex, and verifying with `cmp`.
- Use `docs/reference-configs/external-tooling.md` and `bash scripts/check-agent-tooling.sh --host both --check-updates` for advisory environment checks only.
- When changing `scripts/migrate-project-template.sh` or `scripts/lib/project-init-lib.sh`, verify self-migration of this repo still works.
- Do not treat generated hook adapters or backup files as product deliverables.

## Required Checks

```bash
bun test
bash scripts/check-deploy-sql-order.sh
bash scripts/check-task-sync.sh
bash scripts/check-task-workflow.sh --strict
bun scripts/inspect-project-state.ts --repo . --format text
bash scripts/migrate-project-template.sh --repo . --dry-run
```
