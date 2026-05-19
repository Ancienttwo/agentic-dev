# Operations Workspace

`_ops/` is a commit-ready operations surface for runbooks, submission materials, release checklists, and helper scripts.

## Track

- `_ops/scripts/` for operational scripts.
- `_ops/submissions/` for submission or review materials.
- `_ops/*.md` for runbooks and operating notes.
- `_ops/env/.env.example` for documented variable shapes only.

## Do Not Track

- `_ops/secrets/`
- `_ops/env/.env`
- `_ops/env/.env.*` except `_ops/env/.env.example`
- private keys, production tokens, credential dumps, and local-only overrides

Keep external upstream checkouts and source references in `_ref/`; `_ref/` is ignored and must stay out of commits.
