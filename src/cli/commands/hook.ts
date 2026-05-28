/**
 * `repo-harness hook <event> --route <route-id>` dispatcher.
 *
 * Replaces the per-script scripts/hook-shim.sh by routing through a single
 * registry-defined contract (event, route-id, matcher) → ordered scripts.
 *
 * Behavior contract (verified by tests/cli/hook.test.ts):
 *   - not in a git repo                    → exit 0 silently
 *   - in repo but no opt-in marker         → exit 0 silently
 *   - opt-in + unknown (event, route)      → exit 2 with error
 *   - opt-in + missing .ai/hooks/<script>  → exit 3 with error
 *   - opt-in + script fails                → propagate script exit code
 *   - opt-in + all scripts succeed         → exit 0
 *
 * Sets HOOK_REPO_ROOT in the child environment so .ai/hooks/<script>.sh
 * scripts see the right repo context (matches scripts/hook-shim.sh +
 * .ai/hooks/run-hook.sh behavior — kept for Phase 1G self-migration).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { getRoute, type HookEvent, type RouteId } from '../hook/route-registry';

const OPT_IN_MARKER = '.ai/harness/workflow-contract.json';

export interface RunHookOptions {
  event: HookEvent;
  routeId: RouteId;
  args?: readonly string[];
  cwd?: string;
  /** Pass-through stdio for the spawned hook script. Defaults to inherit. */
  stdio?: 'inherit' | 'pipe' | 'ignore';
  /** Optional override for the hooks dir (test only); defaults to `<repo>/.ai/hooks`. */
  hooksDir?: string;
}

export interface RunHookResult {
  exitCode: number;
  reason:
    | 'not-in-git-repo'
    | 'non-opt-in'
    | 'unknown-route'
    | 'missing-script'
    | 'script-failed'
    | 'ok';
  repoRoot?: string;
  scriptsRun: string[];
  failedScript?: string;
}

export function resolveRepoRoot(cwd: string): string | null {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

export function isOptIn(repoRoot: string): boolean {
  return fs.existsSync(path.join(repoRoot, OPT_IN_MARKER));
}

export function runHook(opts: RunHookOptions): RunHookResult {
  const cwd = opts.cwd ?? process.cwd();
  const scriptsRun: string[] = [];

  const repoRoot = resolveRepoRoot(cwd);
  if (!repoRoot) {
    return { exitCode: 0, reason: 'not-in-git-repo', scriptsRun };
  }
  if (!isOptIn(repoRoot)) {
    return { exitCode: 0, reason: 'non-opt-in', repoRoot, scriptsRun };
  }

  const route = getRoute(opts.event, opts.routeId);
  if (!route) {
    process.stderr.write(
      `repo-harness hook: unknown route ${opts.event}.${opts.routeId}\n`,
    );
    return { exitCode: 2, reason: 'unknown-route', repoRoot, scriptsRun };
  }

  const hooksDir = opts.hooksDir ?? path.join(repoRoot, '.ai/hooks');
  const stdio = opts.stdio ?? 'inherit';

  for (const script of route.scripts) {
    const scriptPath = path.join(hooksDir, script);
    if (!fs.existsSync(scriptPath)) {
      process.stderr.write(
        `repo-harness hook: script not found at ${scriptPath} (route ${opts.event}.${opts.routeId})\n`,
      );
      return {
        exitCode: 3,
        reason: 'missing-script',
        repoRoot,
        scriptsRun,
        failedScript: script,
      };
    }

    scriptsRun.push(script);
    const child = spawnSync('bash', [scriptPath, ...(opts.args ?? [])], {
      cwd: repoRoot,
      stdio,
      env: { ...process.env, HOOK_REPO_ROOT: repoRoot },
    });

    if (child.status !== 0) {
      return {
        exitCode: child.status ?? 1,
        reason: 'script-failed',
        repoRoot,
        scriptsRun,
        failedScript: script,
      };
    }
  }

  return { exitCode: 0, reason: 'ok', repoRoot, scriptsRun };
}
