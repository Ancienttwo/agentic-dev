/**
 * Codex CLI hook-runtime target.
 *
 * Codex CLI 0.130.0+ supports user-level hooks at ~/.codex/hooks.json
 * (verified Phase 0 canary 2026-05-28; see docs/architecture/global-hook-runtime.md
 * § Trust UX — Codex). No project-local hook config concept exists,
 * so supportsLocation('local') returns false and the orchestrator
 * skips Codex cleanly when the user picks --location local.
 *
 * Phase 1A: only supportsLocation + describePaths are meaningful;
 * detect / install / uninstall land in Phase 1B.
 *
 * Reference: _ref/codegraph/src/installer/targets/codex.ts:52-59
 * (same supportsLocation contract; different config surface — codegraph
 * writes ~/.codex/config.toml [mcp_servers.*], we write ~/.codex/hooks.json).
 */

import type {
  AgentTarget,
  DetectionResult,
  InstallOptions,
  Location,
  WriteResult,
} from '../types';

class CodexTarget implements AgentTarget {
  readonly id = 'codex' as const;
  readonly displayName = 'Codex CLI';
  readonly docsUrl = 'https://github.com/openai/codex';

  supportsLocation(loc: Location): boolean {
    return loc === 'global';
  }

  detect(_loc: Location): DetectionResult {
    throw new Error('codexTarget.detect: not yet implemented (Phase 1B)');
  }

  install(_loc: Location, _opts: InstallOptions): WriteResult {
    throw new Error('codexTarget.install: not yet implemented (Phase 1B)');
  }

  uninstall(_loc: Location): WriteResult {
    throw new Error('codexTarget.uninstall: not yet implemented (Phase 1B)');
  }

  describePaths(loc: Location): string[] {
    if (loc !== 'global') return [];
    // Phase 1B replaces with os.homedir() resolution.
    return ['~/.codex/hooks.json'];
  }
}

export const codexTarget: AgentTarget = new CodexTarget();
