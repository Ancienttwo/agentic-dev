---
name: repo-harness-scaffold
description: Creates a new project or module scaffold from the repo-harness plan catalog A-K, then attaches the repo-local workflow harness.
when_to_use: "repo-harness-scaffold, scaffold new project, create new app with agentic workflow, Plan A, Plan B, Plan C, Plan D, Plan E, Plan F, Plan G, Plan H, Plan I, Plan J, Plan K"
---

# repo-harness-scaffold

Use this command when the user asks to create a new project, app, or module skeleton.

## Protocol

1. Confirm the target parent path, project name, plan catalog entry, and package manager.
2. Use the plan catalog A-K from `assets/plan-map.json`.
3. Run `scripts/init-project.sh` or the matching stack template path.
4. Attach the tasks-first workflow through the same contract install path used by `repo-harness-init`.
5. Verify scaffold output and workflow checks.

## Boundaries

- Do not use this command for an existing repo that only needs hooks, docs, or harness files.
- Do not expose `create-project-dirs` as a public command; it is the internal directory/helper installer.
- If the user says "initialize existing repo", route to `repo-harness-init`.
