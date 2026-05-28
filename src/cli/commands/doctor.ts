/**
 * `agentic-dev doctor` — read-only readiness diagnostics.
 *
 * Built-in checks: PATH resolution, CLI version, per-host install detection,
 * Codex user-level trust state count, and CodeGraph readiness. Never mutates.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { ALL_TARGETS } from '../installer/targets/registry';
import { checkCodegraph, type CodegraphCheckResult } from '../tools/codegraph';
import { CLI_VERSION } from './status';

const TRUST_STATE_LINE = /^\[hooks\.state\."[^"]+\/\.codex\/hooks\.json:/;

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'na';

export interface DoctorCheckResult {
  id: string;
  describe: string;
  status: CheckStatus;
  detail: string;
}

export interface DoctorCheck {
  id: string;
  describe: string;
  run(): Omit<DoctorCheckResult, 'id' | 'describe'>;
}

export interface DoctorReport {
  checks: DoctorCheckResult[];
  summary: { ok: number; warn: number; fail: number; na: number };
}

const REGISTERED_CHECKS: DoctorCheck[] = [];

export function registerCheck(check: DoctorCheck): void {
  REGISTERED_CHECKS.push(check);
}

/** Test seam — Phase 1C tests reset after each. */
export function clearRegisteredChecks(): void {
  REGISTERED_CHECKS.length = 0;
}

function homeDir(): string {
  return process.env.HOME ?? os.homedir();
}

function checkPath(): DoctorCheckResult {
  const id = 'cli-on-path';
  const describe = 'agentic-dev resolvable via PATH';
  const result = spawnSync('which', ['agentic-dev'], { encoding: 'utf-8' });
  if (result.status === 0 && (result.stdout ?? '').trim()) {
    return { id, describe, status: 'ok', detail: (result.stdout as string).trim() };
  }
  return {
    id,
    describe,
    status: 'warn',
    detail: 'agentic-dev not on PATH (host adapter shim exits 0 silently when CLI is missing)',
  };
}

function checkVersion(): DoctorCheckResult {
  return { id: 'cli-version', describe: 'agentic-dev CLI version', status: 'ok', detail: CLI_VERSION };
}

function checkTargetInstall(target: (typeof ALL_TARGETS)[number]): DoctorCheckResult {
  const det = target.detect('global');
  const id = `${target.id}-adapter`;
  const describe = `${target.displayName} global adapter`;
  if (!det.installed) {
    return {
      id,
      describe,
      status: 'warn',
      detail: `${target.displayName} host not detected; install when host is set up`,
    };
  }
  if (!det.alreadyConfigured) {
    return {
      id,
      describe,
      status: 'warn',
      detail: `host detected but agentic-dev not installed (run: agentic-dev install --target ${target.id} --location global)`,
    };
  }
  return { id, describe, status: 'ok', detail: `installed at ${det.configPath}` };
}

function checkCodexTrustState(): DoctorCheckResult {
  const id = 'codex-trust-state';
  const describe = 'Codex user-level trust hash registration (~/.codex/config.toml)';
  const configPath = path.join(homeDir(), '.codex', 'config.toml');
  if (!fs.existsSync(configPath)) {
    return { id, describe, status: 'na', detail: 'Codex config.toml not found' };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    let count = 0;
    for (const line of raw.split('\n')) {
      if (TRUST_STATE_LINE.test(line)) count++;
    }
    if (count === 0) {
      return {
        id,
        describe,
        status: 'warn',
        detail: 'no user-level trust hashes registered (restart Codex and accept the trust prompt)',
      };
    }
    return {
      id,
      describe,
      status: 'ok',
      detail: `${count} user-level trust hash entries`,
    };
  } catch (err) {
    return { id, describe, status: 'fail', detail: `error reading config.toml: ${(err as Error).message}` };
  }
}

function doctorStatusForCodegraph(status: CodegraphCheckResult['status']): CheckStatus {
  if (status === 'present') return 'ok';
  if (status === 'missing') return 'fail';
  return 'warn';
}

function formatCodegraphDetail(result: CodegraphCheckResult): string {
  const raw = result.raw as Record<string, any>;
  const indexStatus = raw.project_index?.status ?? 'unknown';
  const codexMcpStatus = raw.mcp_hosts?.codex?.status ?? 'unknown';
  const bits = [
    result.reason,
    `source=${result.resolution.source}`,
    `version=${result.resolution.version ?? 'unknown'}`,
    `codex-mcp=${codexMcpStatus}`,
    `index=${indexStatus}`,
  ];
  if (result.resolution.globalFallbackUsed) bits.push('global-fallback=true');
  const remediation = codegraphRemediation(result);
  if (remediation) bits.push(`remediation=${remediation}`);
  return bits.join('; ');
}

function codegraphRemediation(result: CodegraphCheckResult): string | null {
  if (result.status === 'present') return null;

  const raw = result.raw as Record<string, any>;
  if (result.resolution.source === 'missing') {
    return String(raw.install_command ?? 'bash scripts/ensure-codegraph.sh');
  }
  if (result.resolution.globalFallbackUsed) {
    return String(raw.install_command ?? 'bun install');
  }
  if (raw.mcp_hosts?.codex?.status !== 'configured') {
    return String(raw.mcp_install_command ?? 'codegraph install --target codex --location global --yes');
  }
  if (raw.project_index?.status === 'not-initialized') {
    return String(raw.init_command ?? 'bash scripts/ensure-codegraph.sh --init');
  }
  if (raw.project_index?.status === 'stale') {
    return String(raw.sync_command ?? 'bash scripts/ensure-codegraph.sh --sync');
  }
  return String(raw.ensure_command ?? raw.sync_command ?? 'bash scripts/ensure-codegraph.sh --check');
}

function checkCodegraphReadiness(cwd: string): DoctorCheckResult {
  const id = 'codegraph-readiness';
  const describe = 'CodeGraph CLI, MCP, and project index readiness';
  try {
    const result = checkCodegraph({ repoRoot: cwd });
    return {
      id,
      describe,
      status: doctorStatusForCodegraph(result.status),
      detail: formatCodegraphDetail(result),
    };
  } catch (err) {
    return {
      id,
      describe,
      status: 'fail',
      detail: `error checking CodeGraph readiness: ${(err as Error).message}`,
    };
  }
}

export function runDoctor(cwd: string = process.cwd()): DoctorReport {
  const checks: DoctorCheckResult[] = [];
  checks.push(checkPath());
  checks.push(checkVersion());
  for (const target of ALL_TARGETS) {
    if (target.supportsLocation('global')) {
      checks.push(checkTargetInstall(target));
    }
  }
  checks.push(checkCodexTrustState());
  checks.push(checkCodegraphReadiness(cwd));
  for (const plugin of REGISTERED_CHECKS) {
    const r = plugin.run();
    checks.push({ id: plugin.id, describe: plugin.describe, ...r });
  }
  const summary = { ok: 0, warn: 0, fail: 0, na: 0 };
  for (const c of checks) summary[c.status]++;
  return { checks, summary };
}

export function formatDoctor(report: DoctorReport, asJson = false): string {
  if (asJson) return JSON.stringify(report, null, 2);
  const lines: string[] = [];
  for (const c of report.checks) {
    const icon = c.status === 'ok' ? '✓' : c.status === 'warn' ? '!' : c.status === 'fail' ? '✗' : '-';
    lines.push(`${icon} ${c.id}: ${c.detail}`);
  }
  lines.push('');
  lines.push(
    `Summary: ${report.summary.ok} ok, ${report.summary.warn} warn, ${report.summary.fail} fail, ${report.summary.na} n/a`,
  );
  return lines.join('\n');
}
