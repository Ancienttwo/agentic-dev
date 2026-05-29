import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from "fs";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { runInit, syncCrossReviewSkills } from "../../src/cli/commands/init";

const ROOT = join(import.meta.dir, "..", "..");
const CLI = join(ROOT, "src/cli/index.ts");

function makeExecutable(path: string, body: string): void {
  writeFileSync(path, body);
  chmodSync(path, 0o755);
}

function setupFakeSource(root: string): void {
  mkdirSync(join(root, "scripts"), { recursive: true });
  makeExecutable(
    join(root, "scripts", "sync-codex-installed-copies.sh"),
    "#!/bin/bash\nset -euo pipefail\necho \"sync link=${AGENTIC_DEV_LINK_INSTALLED_COPIES:-unset}\"\n",
  );
  writeFileSync(
    join(root, "scripts", "inspect-project-state.ts"),
    "console.log('mode: initialize')\n",
  );
  makeExecutable(
    join(root, "scripts", "migrate-project-template.sh"),
    [
      "#!/bin/bash",
      "set -euo pipefail",
      "repo=''",
      "mode='dry-run'",
      "while [[ $# -gt 0 ]]; do",
      "  case \"$1\" in",
      "    --repo) repo=\"$2\"; shift 2 ;;",
      "    --apply) mode='apply'; shift ;;",
      "    --dry-run) mode='dry-run'; shift ;;",
      "    *) shift ;;",
      "  esac",
      "done",
      "if [[ \"$mode\" != 'apply' ]]; then",
      "  echo dry-run \"$repo\"",
      "  exit 0",
      "fi",
      "mkdir -p \"$repo/scripts\" \"$repo/.ai/harness\"",
      "printf '{}\\n' > \"$repo/.ai/harness/workflow-contract.json\"",
      "cat > \"$repo/scripts/check-task-workflow.sh\" <<'EOF'",
      "#!/bin/bash",
      "echo '[workflow] OK'",
      "EOF",
      "chmod +x \"$repo/scripts/check-task-workflow.sh\"",
      "echo migrate \"$repo\"",
      "",
    ].join("\n"),
  );
  mkdirSync(join(root, "assets", "skills", "codex-review"), { recursive: true });
  writeFileSync(
    join(root, "assets", "skills", "codex-review", "SKILL.md"),
    "---\nname: codex-review\n---\n",
  );
  mkdirSync(join(root, "assets", "skills", "claude-review"), { recursive: true });
  writeFileSync(
    join(root, "assets", "skills", "claude-review", "SKILL.md"),
    "---\nname: claude-review\n---\n",
  );
}

function writeFakeCodegraph(fakeBin: string, logFile: string): void {
  makeExecutable(
    join(fakeBin, "codegraph"),
    [
      "#!/bin/bash",
      "set -euo pipefail",
      `echo "codegraph $*" >> "${logFile}"`,
      "case \"${1:-}\" in",
      "  \"--version\") echo '0.9.6' ;;",
      "  \"status\")",
      "    if [[ -f .codegraph/initialized ]]; then",
      "      echo 'CodeGraph Status'",
      "      echo 'Index is up to date'",
      "    else",
      "      echo 'CodeGraph Status'",
      "      echo 'Not initialized'",
      "      echo 'Run \"codegraph init\" to initialize'",
      "    fi",
      "    ;;",
      "  \"init\") mkdir -p .codegraph; touch .codegraph/initialized; echo 'initialized' ;;",
      "  \"install\") echo 'installed' ;;",
      "  *) exit 1 ;;",
      "esac",
      "",
    ].join("\n"),
  );
}

describe("init command", () => {
  test("defaults --repo to cwd and applies the existing-repo harness", () => {
    const tmp = join(tmpdir(), `repo-harness-init-${Date.now()}`);
    const source = join(tmp, "source");
    const repo = join(tmp, "repo");
    const previousCwd = process.cwd();
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(repo, { recursive: true });
      setupFakeSource(source);
      process.chdir(repo);

      const result = runInit({
        sourceRoot: source,
        syncSkill: false,
        hostAdapters: false,
        externalSkills: false,
        codegraph: false,
      });

      expect(result.exitCode).toBe(0);
      expect(realpathSync(result.repoRoot)).toBe(realpathSync(repo));
      expect(result.steps.map((step) => step.step)).toContain("apply repo harness");
      expect(existsSync(join(repo, ".ai", "harness", "workflow-contract.json"))).toBe(true);
    } finally {
      process.chdir(previousCwd);
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("bootstraps Waza and diagram-design for Claude and Codex during init", () => {
    const tmp = join(tmpdir(), `repo-harness-init-skills-${Date.now()}`);
    const source = join(tmp, "source");
    const repo = join(tmp, "repo");
    const home = join(tmp, "home");
    const fakeBin = join(tmp, "bin");
    const npxLog = join(tmp, "npx.log");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(repo, { recursive: true });
      mkdirSync(fakeBin, { recursive: true });
      mkdirSync(join(home, ".codex", "skills", "diagram-design"), { recursive: true });
      setupFakeSource(source);
      writeFileSync(join(home, ".codex", "skills", "diagram-design", "SKILL.md"), "---\nname: diagram-design\n---\n");
      makeExecutable(
        join(fakeBin, "npx"),
        `#!/bin/bash\nprintf '%s\\n' "$*" >> "${npxLog}"\nexit 0\n`,
      );

      const result = runInit({
        repo,
        sourceRoot: source,
        syncSkill: false,
        hostAdapters: false,
        verify: false,
        env: {
          ...process.env,
          HOME: home,
          PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
        },
      });

      expect(result.exitCode).toBe(0);
      expect(readFileSync(npxLog, "utf-8")).toContain(
        "-y skills add tw93/Waza -g -a claude-code codex -s check design health hunt learn read think write -y",
      );
      expect(existsSync(join(home, ".codex", "skills", "diagram-design", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".claude", "skills", "diagram-design", "SKILL.md"))).toBe(true);
      // Cross-review skills install host-aware: codex-review on Claude, claude-review on Codex.
      expect(existsSync(join(home, ".claude", "skills", "codex-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".codex", "skills", "claude-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".codex", "skills", "codex-review", "SKILL.md"))).toBe(false);
      expect(existsSync(join(home, ".claude", "skills", "claude-review", "SKILL.md"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("dry-run does not mutate host runtime or apply the target harness", () => {
    const tmp = join(tmpdir(), `repo-harness-init-dry-run-${Date.now()}`);
    const source = join(tmp, "source");
    const repo = join(tmp, "repo");
    const home = join(tmp, "home");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(repo, { recursive: true });
      setupFakeSource(source);

      const result = runInit({
        repo,
        sourceRoot: source,
        apply: false,
        target: "codex",
        env: {
          ...process.env,
          HOME: home,
        },
      });

      expect(result.exitCode).toBe(0);
      expect(result.steps.find((step) => step.step === "sync repo-harness skills")?.detail).toBe("dry-run");
      expect(result.steps.find((step) => step.step === "install host adapters")?.detail).toBe("dry-run");
      expect(existsSync(join(home, ".codex", "hooks.json"))).toBe(false);
      expect(existsSync(join(repo, ".ai", "harness", "workflow-contract.json"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("npx cache sources force copy-based installed skill sync", () => {
    const tmp = join(tmpdir(), `repo-harness-init-npx-${Date.now()}`);
    const source = join(tmp, "_npx", "abc123", "node_modules", "repo-harness");
    const repo = join(tmp, "repo");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(repo, { recursive: true });
      setupFakeSource(source);

      const result = runInit({
        repo,
        sourceRoot: source,
        hostAdapters: false,
        externalSkills: false,
        verify: false,
        codegraph: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.steps.find((step) => step.step === "sync repo-harness skills")?.stdout).toContain(
        "sync link=0",
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("CLI --no-codegraph disables the init CodeGraph step", () => {
    const tmp = join(tmpdir(), `repo-harness-init-cli-codegraph-${Date.now()}`);
    try {
      mkdirSync(tmp, { recursive: true });
      const res = spawnSync(
        "bun",
        [
          CLI,
          "init",
          "--repo",
          tmp,
          "--dry-run",
          "--no-sync-skill",
          "--no-host-adapters",
          "--no-external-skills",
          "--no-verify",
          "--no-codegraph",
          "--json",
        ],
        {
          cwd: ROOT,
          encoding: "utf-8",
        },
      );

      expect(res.status).toBe(0);
      const result = JSON.parse(res.stdout);
      const codegraphStep = result.steps.find((step: { step: string }) => step.step === "ensure codegraph index");
      expect(codegraphStep?.status).toBe("skipped");
      expect(codegraphStep?.detail).toBe("disabled");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 15000);

  test("configures CodeGraph MCP only when explicitly requested", () => {
    const tmp = join(tmpdir(), `repo-harness-init-configure-codegraph-${Date.now()}`);
    const source = join(tmp, "source");
    const repo = join(tmp, "repo");
    const home = join(tmp, "home");
    const fakeBin = join(tmp, "bin");
    const logFile = join(tmp, "codegraph.log");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(repo, { recursive: true });
      mkdirSync(home, { recursive: true });
      mkdirSync(fakeBin, { recursive: true });
      setupFakeSource(source);
      writeFakeCodegraph(fakeBin, logFile);

      const result = runInit({
        repo,
        sourceRoot: source,
        syncSkill: false,
        hostAdapters: false,
        externalSkills: false,
        verify: false,
        configureCodegraphMcp: true,
        env: {
          ...process.env,
          HOME: home,
          PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
          AGENTIC_DEV_CODEGRAPH_ALLOW_REPO_LOCAL: "0",
        },
      });

      expect(result.exitCode).toBe(0);
      expect(result.steps.find((step) => step.step === "ensure codegraph index")?.detail).toContain(
        "init-index:changed",
      );
      const configureStep = result.steps.find((step) => step.step === "configure codegraph mcp");
      expect(configureStep?.status).toBe("ok");
      expect(configureStep?.detail).toContain("configure-codex:changed");
      expect(configureStep?.detail).toContain("configure-claude:changed");

      const log = readFileSync(logFile, "utf-8");
      expect(log).toContain("codegraph init -i .");
      expect(log).toContain("codegraph install --target codex --location global --yes");
      expect(log).toContain("codegraph install --target claude --location global --yes");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 15000);
});

describe("syncCrossReviewSkills", () => {
  function makeSource(root: string): void {
    mkdirSync(join(root, "assets", "skills", "codex-review"), { recursive: true });
    writeFileSync(
      join(root, "assets", "skills", "codex-review", "SKILL.md"),
      "---\nname: codex-review\n---\n",
    );
    mkdirSync(join(root, "assets", "skills", "claude-review"), { recursive: true });
    writeFileSync(
      join(root, "assets", "skills", "claude-review", "SKILL.md"),
      "---\nname: claude-review\n---\n",
    );
  }

  test("installs host-aware: codex-review to Claude, claude-review to Codex", () => {
    const tmp = join(tmpdir(), `cross-review-both-${Date.now()}`);
    const source = join(tmp, "source");
    const home = join(tmp, "home");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(home, { recursive: true });
      makeSource(source);

      const steps = syncCrossReviewSkills(source, "both", { ...process.env, HOME: home });

      expect(steps.every((s) => s.status === "ok")).toBe(true);
      expect(existsSync(join(home, ".claude", "skills", "codex-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".codex", "skills", "claude-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(home, ".codex", "skills", "codex-review", "SKILL.md"))).toBe(false);
      expect(existsSync(join(home, ".claude", "skills", "claude-review", "SKILL.md"))).toBe(false);

      const again = syncCrossReviewSkills(source, "both", { ...process.env, HOME: home });
      expect(again.some((s) => /already present/.test(s.detail ?? ""))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("respects target=claude (only codex-review) and target=codex (only claude-review)", () => {
    const tmp = join(tmpdir(), `cross-review-target-${Date.now()}`);
    const source = join(tmp, "source");
    const claudeHome = join(tmp, "home-claude");
    const codexHome = join(tmp, "home-codex");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(claudeHome, { recursive: true });
      mkdirSync(codexHome, { recursive: true });
      makeSource(source);

      syncCrossReviewSkills(source, "claude", { ...process.env, HOME: claudeHome });
      expect(existsSync(join(claudeHome, ".claude", "skills", "codex-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(claudeHome, ".codex", "skills", "claude-review", "SKILL.md"))).toBe(false);

      syncCrossReviewSkills(source, "codex", { ...process.env, HOME: codexHome });
      expect(existsSync(join(codexHome, ".codex", "skills", "claude-review", "SKILL.md"))).toBe(true);
      expect(existsSync(join(codexHome, ".claude", "skills", "codex-review", "SKILL.md"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("skips (does not fail) when the bundled source is missing", () => {
    const tmp = join(tmpdir(), `cross-review-missing-${Date.now()}`);
    const source = join(tmp, "source");
    const home = join(tmp, "home");
    try {
      mkdirSync(source, { recursive: true });
      mkdirSync(home, { recursive: true });

      const steps = syncCrossReviewSkills(source, "both", { ...process.env, HOME: home });
      expect(steps.every((s) => s.status !== "failed")).toBe(true);
      expect(steps.some((s) => s.status === "skipped")).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
