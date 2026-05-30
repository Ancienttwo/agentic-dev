# README acknowledgements

Date: 2026-05-30

Scope: README-only documentation update for acknowledgements and dependency
clarity.

Decision:

- Add a compact `Acknowledgements and Tooling Dependencies` section to
  `README.md`.
- Keep gstack, Waza, `diagram-design`, and `gbrain` described as external
  operator tooling unless the repo explicitly installs or vendors them.
- Ground package dependencies in `package.json`: Bun as the maintainer runtime,
  `commander` as the runtime npm dependency, and CodeGraph as this repo's
  self-host dev dependency.

Tradeoff: this records the skills and repos that shaped the workflow without
expanding the README into a full dependency guide. Detailed install/update
instructions stay in `docs/reference-configs/external-tooling.md`.
