import { describe, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

const ROOT = join(import.meta.dir, "..");

describe("Codex installed copy sync", () => {
  test("keeps command facades only in the canonical repo-harness copy", () => {
    const tmp = join(tmpdir(), `repo-harness-installed-sync-${Date.now()}`);
    const source = join(tmp, "source");
    const codexSkills = join(tmp, "codex-skills");
    const claudeSkills = join(tmp, "claude-skills");
    const legacyAliasTarget = join(tmp, "legacy-project-initializer-target");

    try {
      mkdirSync(join(source, "assets", "skill-commands", "repo-harness-plan"), { recursive: true });
      mkdirSync(join(source, "evals"), { recursive: true });
      mkdirSync(codexSkills, { recursive: true });
      mkdirSync(claudeSkills, { recursive: true });
      mkdirSync(legacyAliasTarget, { recursive: true });
      symlinkSync(legacyAliasTarget, join(codexSkills, "project-initializer"), "dir");

      writeFileSync(join(source, "SKILL.md"), "---\nname: repo-harness\n---\n");
      writeFileSync(join(source, "assets", "skill-commands", "repo-harness-plan", "SKILL.md"), "---\nname: repo-harness-plan\n---\n");
      writeFileSync(join(source, "assets", "skill-version.json"), "{\"version\":\"test\"}\n");
      writeFileSync(join(source, "evals", "benchmark.md"), "local benchmark output\n");
      mkdirSync(join(source, ".ai", "harness", "checks"), { recursive: true });
      mkdirSync(join(source, ".claude"), { recursive: true });
      mkdirSync(join(source, ".codex"), { recursive: true });
      writeFileSync(join(source, ".ai", "harness", "checks", "latest.json"), "{}\n");
      writeFileSync(join(source, ".claude", ".trace.jsonl"), "{\"local\":true}\n");
      writeFileSync(join(source, ".codex", "hooks.json"), "{}\n");

      const result = spawnSync("bash", [join(ROOT, "scripts", "sync-codex-installed-copies.sh")], {
        cwd: ROOT,
        encoding: "utf-8",
        env: {
          ...process.env,
          AGENTIC_DEV_SOURCE_ROOT: source,
          CODEX_SKILLS_ROOT: codexSkills,
          CLAUDE_SKILLS_ROOT: claudeSkills,
        },
      });

      expect(result.status).toBe(0);
      expect(existsSync(join(codexSkills, "repo-harness", "SKILL.md"))).toBe(true);
      expect(existsSync(join(codexSkills, "repo-harness", "assets", "skill-commands", "repo-harness-plan", "SKILL.md"))).toBe(true);
      expect(existsSync(join(codexSkills, "repo-harness", "evals", "benchmark.md"))).toBe(false);
      expect(existsSync(join(codexSkills, "repo-harness", ".ai", "harness", "checks", "latest.json"))).toBe(false);
      expect(existsSync(join(codexSkills, "repo-harness", ".claude", ".trace.jsonl"))).toBe(false);
      expect(existsSync(join(codexSkills, "repo-harness", ".codex", "hooks.json"))).toBe(false);

      for (const legacyName of ["repo-harness-skill"]) {
        expect(existsSync(join(codexSkills, legacyName, "assets", "skill-version.json"))).toBe(true);
        expect(existsSync(join(codexSkills, legacyName, "SKILL.md"))).toBe(false);
        expect(existsSync(join(codexSkills, legacyName, "assets", "skill-commands"))).toBe(false);
        expect(existsSync(join(codexSkills, legacyName, ".ai", "harness", "checks", "latest.json"))).toBe(false);
        expect(existsSync(join(codexSkills, legacyName, ".claude", ".trace.jsonl"))).toBe(false);
        expect(existsSync(join(codexSkills, legacyName, ".codex", "hooks.json"))).toBe(false);
        expect(existsSync(join(claudeSkills, legacyName, "SKILL.md"))).toBe(true);
        expect(existsSync(join(claudeSkills, legacyName, "assets", "skill-commands", "repo-harness-plan", "SKILL.md"))).toBe(true);
      }

      expect(existsSync(join(codexSkills, "project-initializer"))).toBe(false);
      expect(existsSync(join(claudeSkills, "project-initializer"))).toBe(false);
      expect(existsSync(join(claudeSkills, "repo-harness", "SKILL.md"))).toBe(true);
      expect(existsSync(join(claudeSkills, "repo-harness", ".ai", "harness", "checks", "latest.json"))).toBe(false);
      expect(existsSync(join(claudeSkills, "repo-harness", ".claude", ".trace.jsonl"))).toBe(false);
      expect(existsSync(join(claudeSkills, "repo-harness", ".codex", "hooks.json"))).toBe(false);
      expect(existsSync(join(legacyAliasTarget, "SKILL.md"))).toBe(false);
      expect(existsSync(join(legacyAliasTarget, "assets", "skill-commands"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("can maintain local skill roots as source-backed aliases", () => {
    const tmp = join(tmpdir(), `repo-harness-installed-link-${Date.now()}`);
    const source = join(tmp, "source");
    const codexSkills = join(tmp, "codex-skills");
    const claudeSkills = join(tmp, "claude-skills");

    try {
      mkdirSync(join(source, "assets", "skill-commands", "repo-harness-plan"), { recursive: true });
      mkdirSync(codexSkills, { recursive: true });
      mkdirSync(claudeSkills, { recursive: true });

      writeFileSync(join(source, "SKILL.md"), "---\nname: repo-harness\n---\n");
      writeFileSync(join(source, "assets", "skill-commands", "repo-harness-plan", "SKILL.md"), "---\nname: repo-harness-plan\n---\n");
      writeFileSync(join(source, "assets", "skill-version.json"), "{\"version\":\"test\"}\n");
      writeFileSync(join(source, "README.md"), "source-backed runtime alias\n");

      const result = spawnSync("bash", [join(ROOT, "scripts", "sync-codex-installed-copies.sh")], {
        cwd: ROOT,
        encoding: "utf-8",
        env: {
          ...process.env,
          AGENTIC_DEV_SOURCE_ROOT: source,
          AGENTIC_DEV_LINK_INSTALLED_COPIES: "1",
          CODEX_SKILLS_ROOT: codexSkills,
          CLAUDE_SKILLS_ROOT: claudeSkills,
        },
      });

      expect(result.status).toBe(0);
      expect(lstatSync(join(codexSkills, "repo-harness")).isSymbolicLink()).toBe(true);
      expect(lstatSync(join(claudeSkills, "repo-harness")).isSymbolicLink()).toBe(true);

      for (const legacyName of ["repo-harness-skill"]) {
        expect(existsSync(join(codexSkills, legacyName, "README.md"))).toBe(true);
        expect(existsSync(join(codexSkills, legacyName, "assets", "skill-version.json"))).toBe(true);
        expect(existsSync(join(codexSkills, legacyName, "SKILL.md"))).toBe(false);
        expect(existsSync(join(codexSkills, legacyName, "assets", "skill-commands"))).toBe(false);
        expect(lstatSync(join(claudeSkills, legacyName)).isSymbolicLink()).toBe(true);
        expect(existsSync(join(claudeSkills, legacyName, "SKILL.md"))).toBe(true);
      }
      expect(existsSync(join(codexSkills, "project-initializer"))).toBe(false);
      expect(existsSync(join(claudeSkills, "project-initializer"))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
