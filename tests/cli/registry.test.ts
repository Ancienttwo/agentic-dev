import { describe, expect, test } from 'bun:test';
import {
  ALL_TARGETS,
  getTarget,
  listTargetIds,
} from '../../src/cli/installer/targets/registry';
import { codexTarget } from '../../src/cli/installer/targets/codex';
import { claudeTarget } from '../../src/cli/installer/targets/claude';

describe('installer target registry', () => {
  test('ALL_TARGETS lists codex then claude in stable order', () => {
    expect(ALL_TARGETS.length).toBe(2);
    expect(ALL_TARGETS[0].id).toBe('codex');
    expect(ALL_TARGETS[1].id).toBe('claude');
  });

  test('ALL_TARGETS is frozen so plug-in order cannot drift at runtime', () => {
    expect(Object.isFrozen(ALL_TARGETS)).toBe(true);
  });

  test('getTarget returns the registered instance by id', () => {
    expect(getTarget('codex')).toBe(codexTarget);
    expect(getTarget('claude')).toBe(claudeTarget);
  });

  test('getTarget returns undefined for unknown id', () => {
    expect(getTarget('cursor')).toBeUndefined();
    expect(getTarget('')).toBeUndefined();
    expect(getTarget('CODEX')).toBeUndefined();
  });

  test('listTargetIds matches registry order', () => {
    expect(listTargetIds()).toEqual(['codex', 'claude']);
  });

  test('codex supportsLocation is global-only (Phase 0 verified contract)', () => {
    expect(codexTarget.supportsLocation('global')).toBe(true);
    expect(codexTarget.supportsLocation('local')).toBe(false);
  });

  test('claude supportsLocation accepts both global and local', () => {
    expect(claudeTarget.supportsLocation('global')).toBe(true);
    expect(claudeTarget.supportsLocation('local')).toBe(true);
  });

  test('describePaths returns expected host slot for each location', () => {
    expect(codexTarget.describePaths('global')).toEqual(['~/.codex/hooks.json']);
    expect(codexTarget.describePaths('local')).toEqual([]);
    expect(claudeTarget.describePaths('global')).toEqual(['~/.claude/settings.json']);
    expect(claudeTarget.describePaths('local')).toEqual(['.claude/settings.json']);
  });
});
