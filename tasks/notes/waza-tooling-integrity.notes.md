# Waza Tooling Integrity

## Decision

`check-agent-tooling.sh` now treats a Waza install as a directory-level runtime
bundle, not only a set of `SKILL.md` files.

## Rationale

Waza upstream can add helper files under skill-local `references/`, `scripts/`,
or `agents/`, and newer skill bodies can reference shared files under
`../../rules/`. A `SKILL.md`-only hash check can report `up-to-date` while the
runtime still has broken local references.

## Tradeoff

The detector still stays read-only and avoids a full GitHub tree clone. It
compares host installs against the `~/.agents` staging cache for full skill
directories, and compares the current shared Waza `rules/` files against both
staging and upstream raw URLs. If upstream introduces a new shared top-level
directory, the detector needs a small constant update instead of discovering the
entire repository tree dynamically.
