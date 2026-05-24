---
name: agentic-dev-autoplan
description: Fully automated planning pipeline for agentic-dev workflow work. Reads repo state and existing docs, drafts a plan, reviews it, and surfaces only final decision gates.
when_to_use: "agentic-dev-autoplan, auto plan agentic-dev work, automatic review harness plan, run all agentic-dev reviews, make the workflow planning decisions"
---

# agentic-dev-autoplan

Use this command when the user wants the planning and review pipeline handled automatically.

## Protocol

1. Confirm the working repo and inspect state with `bun scripts/inspect-project-state.ts --repo <repo> --format text` when available.
2. Draft the action plan with `agentic-dev-plan` rules.
3. Review the draft with `agentic-dev-review` rules.
4. Return the final plan, unresolved taste decisions, and the next action command.

## Reusable Workflow Packaging Rubric

When the user wants to package repeated work into a skill, subagent, automation,
or existing command extension:

1. Build a compact shortlist before recommending creation.
2. Use evidence in this order: current repo docs and task files, recent sessions
   or task summaries, Memories and rollout summaries, Chronicle for discovery
   only, then existing skills, custom agents, and automations.
3. For each candidate, report the repeated workflow, evidence and dates,
   frequency/confidence, recommended form, and why to create, extend, or skip it.
4. Act only on high-confidence missing items: repeated at least twice or clearly
   recurring and costly, stable inputs, repeatable procedure, clear output or
   stopping condition, and not already adequately covered.
5. Prefer extending an existing skill, command, subagent, or automation before
   creating a new one.

## Boundaries

- Does not edit files or run mutating scripts by default.
- Never aborts into a long interactive review unless the repo state makes automatic planning unsafe.
- Surfaces only decisions that materially change scope, risk, or command selection.
- Does not create skills, subagents, automations, or command assets until the
  user approves the plan.
