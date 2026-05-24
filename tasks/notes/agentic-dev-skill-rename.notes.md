# Implementation Notes: agentic-dev rename

## Decision

Use `agentic-dev` for the skill/package/repo display surface while preserving `agentic-dev-skill` and `project-initializer` as legacy aliases.

## Compatibility Boundaries

- The initial display rename slice did not migrate filesystem install paths.
- Do not change generated stamp prefix from `project-initializer@...` in this slice.
- Do not change resolver fallbacks that look under `agentic-dev-skill` or `project-initializer` installed paths.
- Move default brain pointers to `icloud/brain/agentic-dev/*`, with `icloud/brain/agentic-dev-skill/*` and `icloud/brain/project-initializer/*` retained as legacy redirect/index paths.

## Follow-Through Surface

The next directory-migration slice can add a new installed path and alias resolver only after source repo checks, installed-copy sync, and migrated-repo version checks are validated together.

## Resolver Update

- `AGENTIC_DEV_ROOT` is now the preferred explicit upstream root.
- `AGENTIC_DEV_SKILL_ROOT` and `PROJECT_INITIALIZER_ROOT` remain legacy explicit upstream roots.
- Runtime lookup prefers `agentic-dev` installed paths and falls back to `agentic-dev-skill` and `project-initializer` installed paths across Codex, Claude, and skills CLI staging.
- The generated version stamp still uses the legacy prefix in this slice.
- `SKILL.md` keeps `agentic-dev-skill` and `project-initializer` in `when_to_use` metadata so legacy triggers remain discoverable even though the frontmatter `name` is `agentic-dev`.

## Installed Copy Follow-Through

- `/Users/chris/.codex/skills/agentic-dev` is now the real Codex new-name installed copy.
- `/Users/chris/.codex/skills/agentic-dev-skill` and `/Users/chris/.codex/skills/project-initializer` remain legacy Codex alias copies and were synced to the same source content.
- `/Users/chris/.claude/skills/agentic-dev` is a symlink alias to the active source repo at `/Users/chris/.claude/skills/project-initializer`.
- Installed-copy sync excludes `.git/`, `_ops/`, `node_modules/`, and `.DS_Store`; destination `_ops/` is preserved.
- Generated helper smoke verified the default resolver path without explicit root envs resolves to `/Users/chris/.codex/skills/agentic-dev`.
