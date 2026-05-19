import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

const ROOT = join(import.meta.dir, "..");

function tmpWorkspace(prefix: string): string {
  const cwd = mkdtempSync(join(tmpdir(), `${prefix}-`));
  mkdirSync(join(cwd, "scripts"), { recursive: true });
  spawnSync("cp", [join(ROOT, "scripts/capability-resolver.ts"), join(cwd, "scripts/capability-resolver.ts")]);
  return cwd;
}

function runResolver(cwd: string, args: string[]) {
  return spawnSync("bun", ["scripts/capability-resolver.ts", ...args], {
    cwd,
    encoding: "utf-8",
  });
}

function writeRegistry(cwd: string, capabilities: unknown[]) {
  mkdirSync(join(cwd, ".ai/context"), { recursive: true });
  writeFileSync(
    join(cwd, ".ai/context/capabilities.json"),
    JSON.stringify({ version: 1, capabilities }, null, 2) + "\n"
  );
}

const webCapability = {
  id: "apps-web",
  domain: "apps-web",
  name: "web",
  prefixes: ["apps/web"],
  contract_files: {
    agents: "apps/web/AGENTS.md",
    claude: "apps/web/CLAUDE.md",
  },
  architecture_module: "docs/architecture/modules/apps-web/web.md",
  workstream_dir: "tasks/workstreams/apps-web/web",
  lsp_profile: "typescript-lsp",
  verification_hints: ["web checks"],
};

const accountCapability = {
  id: "apps-web-account",
  domain: "apps-web",
  name: "account",
  prefixes: ["apps/web/src/routes/account"],
  contract_files: {
    agents: "apps/web/src/routes/account/AGENTS.md",
    claude: "apps/web/src/routes/account/CLAUDE.md",
  },
  architecture_module: "docs/architecture/modules/apps-web/account.md",
  workstream_dir: "tasks/workstreams/apps-web/account",
  lsp_profile: "typescript-lsp",
  verification_hints: ["account checks"],
};

describe("capability resolver", () => {
  test("longest prefix selects nested account capability over apps/web", () => {
    const cwd = tmpWorkspace("capability-longest-prefix");
    try {
      mkdirSync(join(cwd, "apps/web/src/routes/account"), { recursive: true });
      writeRegistry(cwd, [webCapability, accountCapability]);

      const res = runResolver(cwd, ["match", "--path", "apps/web/src/routes/account/page.tsx", "--format", "json"]);
      expect(res.status).toBe(0);
      const match = JSON.parse(res.stdout);
      expect(match.capability_id).toBe("apps-web-account");
      expect(match.matched_prefix).toBe("apps/web/src/routes/account");
      expect(match.workstream_dir).toBe("tasks/workstreams/apps-web/account");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("duplicate same-length prefix fails validation instead of guessing", () => {
    const cwd = tmpWorkspace("capability-prefix-conflict");
    try {
      mkdirSync(join(cwd, "apps/web"), { recursive: true });
      writeRegistry(cwd, [
        webCapability,
        {
          ...webCapability,
          id: "apps-web-duplicate",
          contract_files: {
            agents: "apps/web/DUPLICATE_AGENTS.md",
            claude: "apps/web/DUPLICATE_CLAUDE.md",
          },
        },
      ]);

      const res = runResolver(cwd, ["validate", "--format", "text"]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("duplicate capability prefix: apps/web");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("contract file pairs are required for every capability", () => {
    const cwd = tmpWorkspace("capability-contract-pair");
    try {
      mkdirSync(join(cwd, "apps/web"), { recursive: true });
      writeRegistry(cwd, [
        {
          ...webCapability,
          contract_files: {
            agents: "apps/web/AGENTS.md",
          },
        },
      ]);

      const res = runResolver(cwd, ["validate", "--format", "text"]);
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("apps-web: contract_files.claude is required");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("legacy agent-context-blocks file is only a fallback when registry is absent", () => {
    const cwd = tmpWorkspace("capability-legacy-blocks");
    try {
      mkdirSync(join(cwd, "apps/web/src/routes/account"), { recursive: true });
      mkdirSync(join(cwd, ".ai/context"), { recursive: true });
      writeFileSync(join(cwd, ".ai/context/agent-context-blocks.txt"), "apps/web\napps/web/src/routes/account\n");

      const res = runResolver(cwd, ["match", "--path", "apps/web/src/routes/account/page.tsx", "--format", "json"]);
      expect(res.status).toBe(0);
      const match = JSON.parse(res.stdout);
      expect(match.capability_id).toBe("apps-web-account");
      expect(match.matched_prefix).toBe("apps/web/src/routes/account");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
