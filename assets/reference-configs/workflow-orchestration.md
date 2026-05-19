# Workflow Orchestration (Reference)

Use this file for advanced orchestration and planning patterns.

## 7-Phase Protocol

1. **Research** (`tasks/research.md`)
2. **Plan** (`plans/plan-YYYYMMDD-HHMM-{slug}.md`)
3. **Annotate** (inline notes in plan, 1-6 iterations)
4. **Todo** (`tasks/todo.md`, archive previous todo first)
5. **Implement** (verified slices, update checklist continuously, maintain `tasks/notes/{slug}.notes.md`)
6. **Verify** (`scripts/verify-contract.sh` against `tasks/contracts/{slug}.contract.md`; `scripts/verify-sprint.sh` writes latest checks plus a run snapshot)
7. **Feedback** (`tasks/lessons.md`, archive completed/abandoned plan and todo)

## Research Protocol

- Trigger for new features, unfamiliar code, or architecture-sensitive refactors.
- Read deeply before planning: deeply, in great details, intricacies, go through everything.
- Output research into `tasks/research.md` (not chat-only summaries).
- Use subagents or sidecar `codex exec --json` for broad documentation scans, repo archaeology, large logs, and multi-source synthesis.
- Keep the main thread for decisions, integration, and verification; consume sidecar conclusions and evidence paths rather than raw output.
- Guardrail: do not implement during Research.

## Plan Protocol

- Generate timestamped plan files in `plans/`.
- Keep plan status explicit: `Draft | Annotating | Approved | Executing | Archived | Abandoned`.
- The latest non-archived `plans/plan-*.md` file is the active plan.
- If no active plan exists, run `bash scripts/ensure-task-workflow.sh --slug <slug> --title <title>`.

## Annotation Cycle

- Humans annotate plan inline with corrections/constraints.
- Iterate plan updates 1-6 rounds until status becomes `Approved`.
- Guardrail: no implementation while status is `Draft` or `Annotating`.

## Todo Extraction Protocol

- Extract `## Task Breakdown` from approved plan to `tasks/todo.md`.
- Archive existing todo to `tasks/archive/` before writing new checklist.
- Set plan status to `Executing` after extraction.
- Create `tasks/contracts/{slug}.contract.md` from `.claude/templates/contract.template.md`.
- Create `tasks/notes/{slug}.notes.md` from `.claude/templates/implementation-notes.template.md`.
- Validate workflow integrity with `bash scripts/check-task-workflow.sh --strict`.

## Implementation Protocol

- Execute in small, verified slices.
- Record task-local design decisions, plan/spec deviations, tradeoffs, and open questions in `tasks/notes/{slug}.notes.md`.
- Mark done only with verification evidence in review sections.
- Keep plan/todo status synchronized as work advances.
- For non-chat work, update `tasks/` in the same change-set as substantive repo changes.
- Use `tasks/workstreams/` for durable multi-session progress and `docs/CHANGELOG.md` for release history.

## Feedback & Archive Protocol

- Capture correction-derived prevention rules in `tasks/lessons.md`.
- On completion or abandonment, archive plan to `plans/archive/`.
- Archive associated todo and implementation notes to `tasks/archive/` with outcome metadata.
- Promote notes to `tasks/lessons.md`, `tasks/research.md`, or harness assets only when evidence supports reuse beyond the sprint.

## Shortcut: Skip Research

- Allowed only for familiar, low-risk areas.
- Still require explicit rationale in plan before implementation.

## Multi-Track Execution

- Split only independent tracks.
- Assign one owner per track.
- Merge after each track has verification proof.

## Completion Gate

A task is complete only when contract exit criteria pass and risks are documented.

## Spa Day Protocol

- Periodically consolidate stale rules, references, and old lessons.
- Follow `docs/reference-configs/spa-day-protocol.md` on sprint cadence.
