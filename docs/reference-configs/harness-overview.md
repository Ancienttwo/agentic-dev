# Harness Overview

This repo uses a shared long-running harness. The durable workflow lives in repo-local artifacts, not in chat memory.

## Roles

- **Planner** updates `docs/spec.md`, researches constraints, and writes or approves `plans/plan-*.md`.
- **Generator** implements only against the active sprint contract and keeps `tasks/todo.md` synchronized.
- **Evaluator** writes `tasks/reviews/<slug>.review.md` and scores the current sprint using fresh evidence from `.ai/harness/checks/latest.json`.

## State Flow

1. `docs/spec.md` captures stable product intent.
2. `plans/plan-*.md` captures a concrete execution approach.
3. `tasks/contracts/<slug>.contract.md` defines done for the active sprint.
4. `tasks/todo.md` is the execution projection for the active sprint.
5. `tasks/reviews/<slug>.review.md` records evaluator judgment.
6. `.ai/harness/policy.json` is the machine-readable workflow contract.
7. `agentic_development` inside `.ai/harness/policy.json` captures product, engineering, design, bug-hunt, and review routing.
8. `external_tooling` inside `.ai/harness/policy.json` captures host install/update defaults for gstack, Waza, and gbrain.
9. `.ai/context/context-map.json` indexes stable root context and explicitly selected functional-block context.
10. `documentation` inside `.ai/harness/policy.json` keeps generated docs minimal and moves optional docs to agent-created, evidence-backed output.
11. `lsp_profiles` inside policy and context-map files select tooling hints per functional block.
12. `worktree_strategy` inside policy tells agents when to isolate work in `codex/<slug>` worktrees and validate with Waza `/check` before merging back.
13. `.ai/harness/handoff/current.md` preserves resumable state across sessions.
14. `.ai/harness/events.jsonl` and `.ai/harness/runs/*.json` retain lightweight execution traces.

## Session Boundaries

- Exploration and planning are allowed before a contract exists.
- Implementation should prefer `docs/spec.md`, an approved plan, and an active sprint contract.
- Claiming completion should include contract verification evidence plus a passing review artifact.
- Stopping a session should refresh `.ai/harness/handoff/current.md` for easier resume.
- Use `docs/reference-configs/agentic-development-flow.md` for skill routing and `docs/reference-configs/external-tooling.md` for install/update commands.
- If dirty worktree state overlaps the task, use an isolated `codex/<task-slug>` worktree and merge back only after a clean `/check`-style review.

## Documentation Profile

- Default profile: `minimal-agentic`.
- Required docs: `docs/spec.md` and `docs/PROGRESS.md`.
- Optional docs such as `docs/brief.md`, `docs/tech-stack.md`, `docs/decisions.md`, `docs/architecture.md`, and `docs/packages.md` are created only when the agent has concrete repo evidence or the user asks.
- Use `docs/reference-configs/document-generation.md` for the creation rules.

## Functional Block Context

- Do not infer agent context boundaries from physical layout globs such as `apps/*`, `packages/*`, or `services/*`.
- Select functional blocks through `scripts/select-agent-context-blocks.sh`, `.ai/context/agent-context-blocks.txt`, `PROJECT_INITIALIZER_CONTEXT_BLOCKS`, or existing nested `CLAUDE.md`/`AGENTS.md` files.
- Selected blocks receive paired `CLAUDE.md` and `AGENTS.md` files so Claude Code and Codex share the same local contract.
- Functional-block context entries may carry `lsp_profile`, `doc_scope`, and `verification_hint` metadata.
