import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const COMMAND_ROOT = join(ROOT, "assets", "skill-commands");
const COMMANDS = [
  "repo-harness-plan",
  "repo-harness-review",
  "repo-harness-autoplan",
  "repo-harness-init",
  "repo-harness-scaffold",
  "repo-harness-migrate",
  "repo-harness-upgrade",
  "repo-harness-capability",
  "repo-harness-architecture",
  "repo-harness-handoff",
  "repo-harness-deploy",
  "repo-harness-repair",
  "repo-harness-check",
];

function readCommand(name: string): string {
  return readFileSync(join(COMMAND_ROOT, name, "SKILL.md"), "utf-8");
}

describe("repo-harness action command skills", () => {
  test("manifest exposes exactly the public action command surface", () => {
    const manifest = JSON.parse(readFileSync(join(COMMAND_ROOT, "manifest.json"), "utf-8"));
    expect(manifest.surface).toBe("repo-harness-action-style-skill-commands");
    expect(manifest.router).toBe("repo-harness");
    expect(manifest.commands.map((entry: { name: string }) => entry.name)).toEqual(COMMANDS);
    expect(manifest.nonPublicInternalSteps).toEqual([
      "hooks-init",
      "docs-init",
      "create-project-dirs",
    ]);
  });

  test("each command is a thin standalone skill facade", () => {
    for (const command of COMMANDS) {
      const path = join(COMMAND_ROOT, command, "SKILL.md");
      expect(existsSync(path)).toBe(true);
      const body = readCommand(command);
      const frontmatter = body.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
      expect(frontmatter).toContain(`name: ${command}`);
      expect(frontmatter).toContain("description:");
      expect(frontmatter).toContain("when_to_use:");
      expect(body).toContain("## Protocol");
      expect(body).toContain("## Boundaries");
    }
  });

  test("plan, review, and autoplan are non-mutating by default", () => {
    for (const command of ["repo-harness-plan", "repo-harness-review", "repo-harness-autoplan"]) {
      expect(readCommand(command)).toContain("Does not edit");
    }
    expect(readCommand("repo-harness-plan")).toContain("capture-plan.sh");
  });

  test("autoplan packages repeated workflows only through an evidence-first approval gate", () => {
    const autoplan = readCommand("repo-harness-autoplan");

    expect(autoplan).toContain("Reusable Workflow Packaging Rubric");
    expect(autoplan).toContain("Memories and rollout summaries");
    expect(autoplan).toContain("Chronicle for discovery");
    expect(autoplan).toContain("only, then existing skills");
    expect(autoplan).toContain("frequency/confidence");
    expect(autoplan).toContain("Prefer extending an existing skill");
    expect(autoplan).toContain("Does not create skills, subagents, automations");
    expect(autoplan).toContain("user approves the plan");
  });

  test("init and scaffold keep existing-repo adoption separate from app scaffolding", () => {
    const init = readCommand("repo-harness-init");
    const scaffold = readCommand("repo-harness-scaffold");

    expect(init).toContain("existing repository");
    expect(init).toContain("Does not create a new application stack");
    expect(init).toContain("migrate-project-template.sh --repo <repo> --apply");
    expect(scaffold).toContain("new project");
    expect(scaffold).toContain("plan catalog A-K");
    expect(scaffold).toContain("If the user says \"initialize existing repo\", route to `repo-harness-init`");
  });

  test("migration and upgrade commands preserve user-owned surfaces", () => {
    const migrate = readCommand("repo-harness-migrate");
    const upgrade = readCommand("repo-harness-upgrade");

    expect(migrate).toContain("Preserve or archive user-authored content");
    expect(migrate).toContain("ownership=known_generated");
    expect(upgrade).toContain("known_generated");
    expect(upgrade).toContain("Preserve `_ref/`, `_ops/`, secrets, local env, custom hooks");
  });

  test("capability command is a targeted registry update instead of full init", () => {
    const capability = readCommand("repo-harness-capability");

    expect(capability).toContain("capability-config.ts add");
    expect(capability).toContain("Does not run `scripts/migrate-project-template.sh --apply`");
    expect(capability).toContain("Does not install or refresh the full harness");
    expect(capability).toContain("explicit prefixes");
  });

  test("architecture, handoff, and deploy commands stay focused", () => {
    const architecture = readCommand("repo-harness-architecture");
    const handoff = readCommand("repo-harness-handoff");
    const deploy = readCommand("repo-harness-deploy");

    expect(architecture).toContain("archive-architecture-request.sh");
    expect(architecture).toContain("diagram-design");
    expect(architecture).toContain("Does not run `scripts/migrate-project-template.sh --apply`");
    expect(architecture).toContain("hooks only record drift requests");

    expect(handoff).toContain("prepare-codex-handoff.sh");
    expect(handoff).toContain("codex-handoff-resume.sh");
    expect(handoff).toContain("Does not run `/check`");
    expect(handoff).toContain("handoff packet files");

    expect(deploy).toContain("Read-only by default");
    expect(deploy).toContain("check-deploy-sql-order.sh");
    expect(deploy).toContain("Does not publish or deploy");
    expect(deploy).toContain("_ops/");
  });

  test("public docs name the command surface and keep internal steps private", () => {
    const skill = readFileSync(join(ROOT, "SKILL.md"), "utf-8");
    const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
    const flow = readFileSync(join(ROOT, "docs", "reference-configs", "agentic-development-flow.md"), "utf-8");
    const docs = [skill, readme, flow].join("\n");

    for (const command of COMMANDS) {
      expect(docs).toContain(command);
    }
    expect(docs).toContain("hooks-init");
    expect(docs).toContain("docs-init");
    expect(docs).toContain("create-project-dirs");
    expect(docs).toContain("not public");
  });
});
