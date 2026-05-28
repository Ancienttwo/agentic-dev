/**
 * Claude Code hook-runtime target.
 *
 * Claude Code supports both user-level (~/.claude/settings.json) and
 * project-level (.claude/settings.json) hook config. Merging precedence
 * is managed > local > project > user — not override — so the same
 * event in multiple scopes fires every registered hook (verified
 * Phase 0 canary 2026-05-28; see docs/architecture/global-hook-runtime.md
 * § Trust UX — Claude). supportsLocation returns true for both.
 *
 * Phase 1A: only supportsLocation + describePaths are meaningful;
 * detect / install / uninstall land in Phase 1B.
 */

import type {
  AgentTarget,
  DetectionResult,
  InstallOptions,
  Location,
  WriteResult,
} from '../types';

class ClaudeTarget implements AgentTarget {
  readonly id = 'claude' as const;
  readonly displayName = 'Claude Code';
  readonly docsUrl = 'https://code.claude.com';

  supportsLocation(_loc: Location): boolean {
    return true;
  }

  detect(_loc: Location): DetectionResult {
    throw new Error('claudeTarget.detect: not yet implemented (Phase 1B)');
  }

  install(_loc: Location, _opts: InstallOptions): WriteResult {
    throw new Error('claudeTarget.install: not yet implemented (Phase 1B)');
  }

  uninstall(_loc: Location): WriteResult {
    throw new Error('claudeTarget.uninstall: not yet implemented (Phase 1B)');
  }

  describePaths(loc: Location): string[] {
    // Phase 1B replaces with os.homedir() / cwd resolution.
    if (loc === 'global') return ['~/.claude/settings.json'];
    return ['.claude/settings.json'];
  }
}

export const claudeTarget: AgentTarget = new ClaudeTarget();
