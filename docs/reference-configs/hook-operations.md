# Hook Operations (Reference)

Use this file when you need to understand hook ownership, failure handling, or
self-host versus generated hook parity.

## Hook Authority Map

Start with the shortest truth path:

1. `.claude/settings.json` wires Claude events into the repo-local hook runner.
2. `.ai/hooks/run-hook.sh` resolves the repo root and dispatches the selected hook.
3. `.ai/hooks/*` is the shared implementation layer and the default place to edit.

If you are asking "which hook file should I edit?", default to `.ai/hooks/`.

## Hook Failure Playbook

When a hook blocks work, use this sequence:

1. Read the terminal output first. The structured payload exposes:
   - `guard`: which guard fired
   - `reason`: what failed
   - `fix`: the shortest next action
   - `failure_class`: whether this is missing artifact, state violation, contract failure, or quality gate
   - `run_id`: correlation key for failure and trace logs
2. Read `.ai/harness/failures/latest.jsonl` for the durable failure record.
3. Read `.claude/.trace.jsonl` for surrounding tool activity and timing.
4. If you need an aggregate view, run:

```bash
bash scripts/summarize-failures.sh --run-id <run_id>
```

## Common Guards and the Fastest Fix

| Guard | What it usually means | Fastest fix |
|------|------------------------|-------------|
| `PlanStatusGuard` | No active plan, or the active plan is still `Draft` / `Annotating` | `bash scripts/ensure-task-workflow.sh --slug <slug> --title <title>` or finish the annotation cycle and move the plan to `Approved` |
| `TodoGuard` | The active plan changed, but `tasks/todo.md` still points at older execution state | `bash scripts/plan-to-todo.sh --plan <active-plan>` or `bash scripts/switch-plan.sh --plan <active-plan>` |
| `ContractGuard` | Completion was claimed without a contract, or contract verification failed | Create or regenerate `tasks/contracts/<slug>.contract.md`, then run `bash scripts/verify-contract.sh --contract tasks/contracts/<slug>.contract.md --strict` |
| `WorktreeGuard` | Writes were attempted from the primary worktree while `.claude/.require-worktree` is enforced | `git worktree add ../<repo>-wt-<branch> -b <branch>` and retry from the linked worktree |

## Architecture Drift Hooks

Architecture maintenance is split across two helpers:

- `scripts/architecture-drift.sh` detects architecture-sensitive edits and writes a human request under `docs/architecture/requests/` plus a machine event in `.ai/harness/architecture/events.jsonl`.
- `scripts/capability-resolver.ts` resolves changed paths against `.ai/context/capabilities.json` using longest-prefix matching.
- `scripts/workstream-sync.sh` maintains durable multi-session progress under `tasks/workstreams/<domain>/<capability>/` for a selected capability.
- `scripts/context-contract-sync.sh` consumes architecture or workstream events and updates only the controlled `<!-- BEGIN ARCHITECTURE CONTRACT -->` block in matched capability `CLAUDE.md` and `AGENTS.md` files.

The helpers keep hook boundaries explicit: drift detection never writes agent context files, workstream sync writes its event to `.ai/harness/events.jsonl` instead of a separate workstream event log, and context sync only projects pointers/current-slice metadata into local contracts. Agents produce snapshots under `docs/architecture/snapshots/` and standalone `diagram-design` HTML under `docs/architecture/diagrams/`.

## When to Check Tests or Migration

- Check `tests/` when the hook output is wrong or the workflow contract no longer matches expected behavior.
- Check `scripts/migrate-project-template.sh` and `scripts/create-project-dirs.sh` when generated repos receive the wrong files or stale wiring.

## Self-Host vs Generated Parity Contract

This repo has two hook surfaces on purpose:

- `assets/hooks/` defines what downstream generated repos receive.
- `.ai/hooks/` defines this self-hosted repo's current runtime behavior.

They are related, but not automatically synchronized. Because of that:

1. Downstream behavior is judged by generated output, not by the self-hosted repo alone.
2. Every hook change should state whether it affects `self-host`, `generated`, or `both`.
3. If behavior must stay aligned, update both surfaces in the same change.
4. Treat parity drift as a documented risk, not as a hidden assumption.

## Verification Checklist

Run these after hook or workflow contract changes:

```bash
bun test
bash scripts/check-task-sync.sh
bash scripts/check-task-workflow.sh --strict
bash scripts/migrate-project-template.sh --repo . --dry-run
```
