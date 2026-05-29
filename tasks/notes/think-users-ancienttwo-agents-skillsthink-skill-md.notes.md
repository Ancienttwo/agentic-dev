# Implementation Notes: think-users-ancienttwo-agents-skillsthink-skill-md

> **Status**: Complete
> **Plan**: plans/plan-20260530-0142-think-users-ancienttwo-agents-skillsthink-skill-md.md
> **Contract**: tasks/contracts/think-users-ancienttwo-agents-skillsthink-skill-md.contract.md
> **Review**: tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md
> **Last Updated**: 2026-05-30 02:23
> **Lifecycle**: notes

## Design Decisions

- Keep peer model execution outside hooks. Hooks only print the `[ExternalAcceptance]` prompt and completion gates parse review-file evidence.
- Use `tasks/reviews/<slug>.review.md` as the single acceptance authority; `.ai/harness/checks/latest.json` mirrors parsed status for machine evidence only.
- Allow `Manual Override:` as an explicit escape hatch for peer CLI auth/network outages, but require a concrete reason.
- Accept direct Codex shell execution by detecting Codex-specific environment variables when `HOOK_HOST` is absent.

## Deviations From Plan Or Spec

- None on scope. The implementation stayed inside hook state, prompt routing, finish/verify helpers, generated templates, docs, and tests.
- Full-suite verification exposed existing CodeGraph/doctor tests that run real readiness probes for 5-8 seconds in this worktree. Their timeouts were widened only to match the verified runtime; product behavior was not changed.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Auto-run peer CLI from hook | Rejected | Hooks must stay fast, quiet, and auth/network independent. |
| Store external evidence in a new file | Rejected | The review file already owns acceptance verdicts and is easier to audit. |
| Fail hard when parser helpers are absent | Rejected | Existing generated repos may refresh helpers in stages; graceful degradation keeps old installs usable. |

## Open Questions

- Whether to add stricter missing-field diagnostics for external acceptance block parsing.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Review: `tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md`
- External acceptance: `tasks/reviews/think-users-ancienttwo-agents-skillsthink-skill-md.review.md#external-acceptance-advice`

## Promotion Candidates

- Promote the "hooks emit prompts but never run peer CLIs" invariant into durable workflow docs after one downstream repo validates the flow.
