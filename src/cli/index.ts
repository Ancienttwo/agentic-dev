#!/usr/bin/env bun
/**
 * agentic-dev CLI entry — Phase 1A scaffold.
 *
 * Five subcommands are declared but stubbed. Phase 1B replaces this
 * stub dispatcher with commander.js + real command bodies. Right now
 * the entry exists only so `bun src/cli/index.ts <cmd>` and the
 * package.json `bin` resolution can be validated end-to-end.
 *
 * See plans/plan-20260528-1436-hook-global-runtime.md § Phase 1A.
 */

export const SUBCOMMANDS = ['install', 'hook', 'status', 'doctor', 'migrate'] as const;
export type Subcommand = (typeof SUBCOMMANDS)[number];

function isSubcommand(s: string): s is Subcommand {
  return (SUBCOMMANDS as readonly string[]).includes(s);
}

function printUsage(): void {
  console.log('Usage: agentic-dev <command> [args...]');
  console.log('');
  console.log('Commands:');
  for (const cmd of SUBCOMMANDS) {
    console.log(`  ${cmd}  (Phase 1A stub; real body lands in Phase 1B)`);
  }
}

export function main(argv: readonly string[]): number {
  const cmd = argv[0];
  if (!cmd || cmd === '--help' || cmd === '-h') {
    printUsage();
    return 0;
  }
  if (cmd === '--version' || cmd === '-v') {
    console.log('agentic-dev 0.0.0-phase1a');
    return 0;
  }
  if (!isSubcommand(cmd)) {
    console.error(`agentic-dev: unknown command \"${cmd}\"`);
    printUsage();
    return 1;
  }
  console.error(`agentic-dev ${cmd}: not yet implemented (Phase 1A scaffold)`);
  return 2;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
