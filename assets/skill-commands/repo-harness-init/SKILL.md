---
name: repo-harness-init
description: Installs or refreshes the repo-harness workflow in an existing repository. Adds hooks, docs/spec.md, tasks, plans, .ai/context, .ai/harness, helpers, and policy without creating an application stack.
when_to_use: "repo-harness-init, initialize existing repo, add agentic workflow to existing repo, refresh repo-local harness, install tasks-first harness"
---

# repo-harness-init

Use this command for an existing repository that needs the repo-local agentic workflow installed or refreshed.

## Protocol

1. Confirm the target repo path.
2. If running from the target repo root, use `repo-harness init`; do not require `--repo .`.
3. Run `bun scripts/inspect-project-state.ts --repo <repo> --format text`.
4. If the repo is legacy, route to `repo-harness-migrate`.
5. Otherwise run the safe path through `repo-harness init` or `bash scripts/migrate-project-template.sh --repo <repo> --apply`.
6. Bootstrap the expected host runtime skills in the same pass: Waza (`check`, `design`, `health`, `hunt`, `learn`, `read`, `think`, `write`) and `diagram-design` for Codex/Claude when source copies are available.
7. Verify with `bash scripts/check-task-workflow.sh --strict` inside the target repo when the helper exists.

## Boundaries

- Does not create a new application stack.
- Does not call `scripts/init-project.sh` for product scaffold work.
- Preserves existing user-authored repo files unless the workflow contract explicitly owns the generated surface.
