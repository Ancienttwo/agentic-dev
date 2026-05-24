---
name: agentic-dev-repair
description: Repairs a broken current harness, including task sync, hook routing, handoff, context-map, policy, helper, and generated/runtime drift.
when_to_use: "agentic-dev-repair, repair broken agentic workflow, fix task sync, fix hook routing, fix handoff, repair .ai harness, repair context-map"
---

# agentic-dev-repair

Use this command when the repo has a harness but a specific workflow surface is broken.

## Protocol

1. Reproduce the failure and name the failing surface.
2. Run `bun scripts/inspect-project-state.ts --repo <repo> --format text`.
3. Trace the failing path, such as `settings.json -> .ai/hooks/run-hook.sh -> .ai/hooks/*` or `plans/ -> tasks/todo.md -> tasks/contracts/`.
4. Apply the smallest targeted fix.
5. Re-run the failing check and the relevant workflow gate.

## Boundaries

- Do not use repair to migrate a legacy repo; route legacy contract drift to `agentic-dev-migrate`.
- Do not use repair to scaffold product code.
- Preserve unrelated dirty worktree changes.
