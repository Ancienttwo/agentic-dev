## Project Structure

```
{{PROJECT_STRUCTURE}}
```

### Tech Stack

| Layer | Technology |
|-------|------------|
{{TECH_STACK_TABLE}}

---

## Workflow Rules

- Prefer modifying existing files over adding new files.
- {{RUNTIME_MODE}} by default for file mutations.
- Primary worktree warns by default; enforce via `.claude/.require-worktree`.
- Commit explicitly after green checks; no automatic checkpoint hook in the shared preset.
- Keep stable product truth in `docs/spec.md`.
- Keep sprint done definitions in `tasks/contracts/` and `tasks/reviews/`.
- Keep resumable state in `.ai/harness/handoff/current.md`.
- Route product discovery to gstack `office-hours`, complex engineering plans to gstack `plan-eng-review`, design plans to gstack `plan-design-review`, and daily small/medium planning, bug hunts, and checks to Waza `/think`, `/hunt`, and `/check`.
- Route knowledge sync and handoff retrieval to `gbrain`.
- Treat Waza as Codex-first: `~/.codex/skills` is the Codex runtime source; `~/.agents/skills` is skills CLI staging/cache only.
- Use `docs/reference-configs/agentic-development-flow.md` for routing details and `docs/reference-configs/external-tooling.md` plus `bash scripts/check-agent-tooling.sh --host both --check-updates` for advisory environment checks.
- If repo state conflicts with the task, use an isolated `codex/<task-slug>` worktree, validate with Waza `/check`, and merge back to `main` without unrelated dirty changes.
