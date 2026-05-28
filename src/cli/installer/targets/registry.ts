/**
 * Registry of all known agentic-dev install targets.
 *
 * Adding a new target = create targets/<id>.ts exporting an AgentTarget,
 * then add it to ALL_TARGETS below. Order here is the order targets
 * appear in `--target=all` and help listings — keep it stable.
 *
 * Modeled after _ref/codegraph/src/installer/targets/registry.ts:20-29.
 * Phase 1A intentionally omits resolveTargetFlag / detectAll helpers —
 * those land with the install command in Phase 1B.
 */

import type { AgentTarget, TargetId } from '../types';
import { codexTarget } from './codex';
import { claudeTarget } from './claude';

export const ALL_TARGETS: readonly AgentTarget[] = Object.freeze([
  codexTarget,
  claudeTarget,
]);

export function getTarget(id: string): AgentTarget | undefined {
  return ALL_TARGETS.find((t) => t.id === id);
}

export function listTargetIds(): TargetId[] {
  return ALL_TARGETS.map((t) => t.id);
}
