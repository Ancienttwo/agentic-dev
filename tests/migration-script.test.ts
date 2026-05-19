import { describe, test, expect } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

const ROOT = join(import.meta.dir, "..");

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

describe("Migration script contract", () => {
  test("should provide dry-run and apply modes", () => {
    const script = read("scripts/migrate-project-template.sh");
    expect(script).toContain("--dry-run");
    expect(script).toContain("--apply");
    expect(script).toContain("--repo");
  });

  test("should migrate team hooks to settings.json", () => {
    const script = read("scripts/migrate-project-template.sh");
    expect(script).toContain(".claude/settings.json");
    expect(script).toContain("settings.local.json");
    expect(script).toContain("migrate_workflow");
  });

  test("should route legacy docs through the dedicated migrator", () => {
    const script = read("scripts/migrate-project-template.sh");
    const migrator = read("scripts/migrate-workflow-docs.ts");
    expect(script).toContain("migrate-workflow-docs.ts");
    expect(migrator).toContain("docs/TODO.md");
    expect(migrator).toContain("docs/plan.md");
    expect(migrator).toContain("docs/PROGRESS.md");
  });

  test("should migrate workflow files and runtime ignore block", () => {
    const script = read("scripts/migrate-project-template.sh");
    const sharedLib = read("scripts/lib/project-init-lib.sh");
    const workflowContract = read("assets/workflow-contract.v1.json");
    expect(script).toContain("docs/spec.md");
    expect(script).toContain("plans/archive");
    expect(script).toContain("tasks/archive");
    expect(script).toContain("tasks/research.md");
    expect(script).toContain("tasks/todo.md");
    expect(script).toContain("tasks/lessons.md");
    expect(script).toContain("tasks/reviews");
    expect(script).toContain("tasks/notes");
    expect(script).toContain(".ai/context");
    expect(script).toContain(".ai/harness/checks/latest.json");
    expect(script).toContain(".ai/harness/policy.json");
    expect(script).toContain(".ai/harness/events.jsonl");
    expect(script).toContain(".ai/harness/handoff/current.md");
    expect(script).toContain(".ai/harness/context-budget");
    expect(script).toContain(".ai/harness/workflow-contract.json");
    expect(workflowContract).toContain("new-spec.sh");
    expect(workflowContract).toContain("new-sprint.sh");
    expect(workflowContract).toContain("new-plan.sh");
    expect(workflowContract).toContain("plan-to-todo.sh");
    expect(workflowContract).toContain("archive-workflow.sh");
    expect(workflowContract).toContain("prepare-handoff.sh");
    expect(workflowContract).toContain("verify-contract.sh");
    expect(workflowContract).toContain("summarize-failures.sh");
    expect(workflowContract).toContain("verify-sprint.sh");
    expect(workflowContract).toContain("check-task-sync.sh");
    expect(workflowContract).toContain("check-agent-tooling.sh");
    expect(workflowContract).toContain("check-context-files.sh");
    expect(workflowContract).toContain("ensure-task-workflow.sh");
    expect(workflowContract).toContain("check-task-workflow.sh");
    expect(workflowContract).toContain("maintenance-triage.sh");
    expect(workflowContract).toContain("context-budget.ts");
    expect(workflowContract).toContain("capability-resolver.ts");
    expect(workflowContract).toContain("architecture-drift.sh");
    expect(workflowContract).toContain("context-contract-sync.sh");
    expect(workflowContract).toContain("workstream-sync.sh");
    expect(workflowContract).toContain("prepare-codex-handoff.sh");
    expect(workflowContract).toContain("codex-handoff-resume.sh");
    expect(workflowContract).toContain("implementation-notes.template.md");
    expect(script).toContain("pi_ensure_task_sync");
    expect(sharedLib).toContain("check:task-sync");
    expect(sharedLib).toContain("check:task-workflow");
    expect(script).toContain("tasks/contracts");
    expect(workflowContract).toContain("docs/architecture/index.md");
    expect(workflowContract).toContain(".ai/context/capabilities.json");
    expect(workflowContract).toContain(".ai/harness/architecture/events.jsonl");
    expect(workflowContract).not.toContain(".ai/harness/workstreams/events.jsonl");
    expect(script).toContain("pi_install_reference_configs");
    expect(workflowContract).toContain("document-generation.md");
    expect(sharedLib).toContain("claude-runtime-temp");
    expect(script).toContain("docs/reference-configs");
    expect(script).toContain("Existing external_tooling overrides are preserved");
    expect(read("assets/workflow-contract.v1.json")).toContain('"runtimeManifest": ".ai/harness/workflow-contract.json"');
  });

  test("should include external tooling defaults and advisory output in dry-run reports", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-dry-run-"));
    try {
      mkdirSync(join(repo, "docs"), { recursive: true });
      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--dry-run"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      expect(res.stdout).toContain("--- External Tooling ---");
      expect(res.stdout).toContain("routing complex->gstack, simple->waza, knowledge->gbrain");
      expect(res.stdout).toContain("Hosts: claude-code, codex");
      expect(res.stdout).toContain("Advisory report (dry-run snapshot)");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should apply migration and create workflow artifacts with single-source plan workflow", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-apply-"));
    try {
      mkdirSync(join(repo, "docs"), { recursive: true });
      mkdirSync(join(repo, "plans"), { recursive: true });
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));

      writeFileSync(join(repo, "docs/TODO.md"), "legacy todo\n");
      writeFileSync(join(repo, "docs/plan.md"), "legacy pointer\n");
      writeFileSync(join(repo, ".gitignore"), "# base\n");
      writeFileSync(
        join(repo, ".claude/settings.local.json"),
        JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Bash", hooks: [] }] } }, null, 2)
      );

      writeFileSync(join(repo, "plans/plan-20260304-0900-alpha.md"), "# Plan alpha\n\n> **Status**: Draft\n");
      writeFileSync(join(repo, "plans/plan-20260304-1000-beta.md"), "# Plan beta\n\n> **Status**: Draft\n");

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      expect(existsSync(join(repo, "plans/archive"))).toBe(true);
      expect(existsSync(join(repo, "tasks/archive"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/research.template.md"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/spec.template.md"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/plan.template.md"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/contract.template.md"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/review.template.md"))).toBe(true);
      expect(existsSync(join(repo, ".claude/templates/implementation-notes.template.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/spec.md"))).toBe(true);
      expect(existsSync(join(repo, "tasks/reviews"))).toBe(true);
      expect(existsSync(join(repo, "tasks/notes"))).toBe(true);
      expect(existsSync(join(repo, ".ai/context/context-map.json"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/checks/latest.json"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/policy.json"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/events.jsonl"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/failures/latest.jsonl"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/handoff/current.md"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/handoff/resume.md"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/context-budget/latest.json"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/workflow-contract.json"))).toBe(true);
      expect(existsSync(join(repo, ".ai/harness/runs/.gitkeep"))).toBe(true);
      expect(existsSync(join(repo, "scripts/new-spec.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/new-sprint.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/new-plan.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/plan-to-todo.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/archive-workflow.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/prepare-handoff.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/verify-contract.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/summarize-failures.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/verify-sprint.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/check-task-sync.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/check-agent-tooling.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/check-context-files.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/ensure-task-workflow.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/check-task-workflow.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/maintenance-triage.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/context-budget.ts"))).toBe(true);
      expect(existsSync(join(repo, "scripts/prepare-codex-handoff.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/codex-handoff-resume.sh"))).toBe(true);
      expect(existsSync(join(repo, "scripts/skill-factory-create.sh"))).toBe(false);
      expect(existsSync(join(repo, "scripts/skill-factory-check.sh"))).toBe(false);
      expect(existsSync(join(repo, ".ai/hooks/run-hook.sh"))).toBe(true);
      expect(existsSync(join(repo, ".ai/hooks/finalize-handoff.sh"))).toBe(true);
      expect(existsSync(join(repo, ".ai/hooks/session-start-context.sh"))).toBe(true);
      expect(existsSync(join(repo, ".ai/hooks/lib/skill-factory.sh"))).toBe(false);
      expect(existsSync(join(repo, ".ai/hooks/lib/memory-state.sh"))).toBe(false);
      expect(existsSync(join(repo, ".ai/hooks/memory-intake.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/run-hook.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/finalize-handoff.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/session-start-context.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/hook-input.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/lib/workflow-state.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/lib/session-state.sh"))).toBe(false);
      expect(existsSync(join(repo, "tasks/research.md"))).toBe(true);
      expect(existsSync(join(repo, "tasks/todo.md"))).toBe(true);
      expect(existsSync(join(repo, "tasks/lessons.md"))).toBe(true);
      expect(existsSync(join(repo, "tasks/contracts"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/handoff-protocol.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/harness-overview.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/document-generation.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/agentic-development-flow.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/external-tooling.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/sprint-contracts.md"))).toBe(true);
      expect(existsSync(join(repo, "docs/reference-configs/spa-day-protocol.md"))).toBe(false);
      expect(existsSync(join(repo, "docs/reference-configs/hook-operations.md"))).toBe(false);
      expect(existsSync(join(repo, "docs/reference-configs/evaluator-rubric.md"))).toBe(false);
      expect(existsSync(join(repo, ".claude/skill-factory/rubric.template.json"))).toBe(false);
      expect(existsSync(join(repo, ".claude/skill-factory/registry.json"))).toBe(false);

      expect(existsSync(join(repo, "docs/TODO.md"))).toBe(false);
      expect(existsSync(join(repo, "docs/plan.md"))).toBe(false);
      expect(existsSync(join(repo, "docs/TODO.md.migrated.bak"))).toBe(true);
      expect(existsSync(join(repo, "docs/plan.md.migrated.bak"))).toBe(true);
      expect(existsSync(join(repo, "tasks/archive/legacy-docs-TODO.md"))).toBe(true);
      expect(existsSync(join(repo, "plans/archive/legacy-docs-plan.md"))).toBe(true);

      const progress = readFileSync(join(repo, "docs/PROGRESS.md"), "utf-8");
      expect(progress).toContain("milestone checkpoints only");
      expect(progress).toContain("tasks/contracts/");
      expect(progress).toContain("tasks/reviews/");
      expect(progress).toContain("tasks/notes/");
      const spec = readFileSync(join(repo, "docs/spec.md"), "utf-8");
      expect(spec).toContain("# Product Spec:");

      const settings = readFileSync(join(repo, ".claude/settings.json"), "utf-8");
      expect(settings).toContain(".ai/hooks/run-hook.sh");
      expect(settings).toContain("session-start-context.sh");
      expect(settings).toContain("trace-event.sh");
      expect(settings).not.toContain("memory-intake.sh");
      expect(settings).not.toContain("skill-factory-session-end.sh");

      const handoff = readFileSync(join(repo, ".ai/harness/handoff/current.md"), "utf-8");
      expect(handoff).toContain("# Harness Handoff");
      const policy = JSON.parse(readFileSync(join(repo, ".ai/harness/policy.json"), "utf-8"));
      expect(policy.external_tooling.routing).toEqual({
        complex: "gstack",
        simple: "waza",
        knowledge: "gbrain",
      });
      expect(policy.external_tooling.hosts).toEqual(["claude-code", "codex"]);
      expect(policy.external_tooling.mode).toBe("guidance-only");
      expect(policy.external_tooling.waza.primary_host).toBe("codex");
      expect(policy.external_tooling.waza.sync_mode).toBe("stage-upstream-then-copy-to-codex");
      expect(policy.external_tooling.codex_automation_profile.required_skills).toEqual(["health", "check", "diagram-design"]);
      expect(policy.external_tooling.codex_automation_profile.mode).toBe("codex-runtime-reference");
      expect(policy.external_tooling.codex_automation_profile.routes.architecture_diagram).toBe("diagram-design");
      expect(policy.external_tooling.codex_automation_profile.vendoring_policy).toBe("do-not-vendor-skill-body");
      expect(policy.external_tooling.gbrain.mcp).toBe("candidate-disabled");
      expect(policy.agentic_development.routing).toEqual({
        product_discovery: "gstack:office-hours",
        complex_engineering_plan: "gstack:plan-eng-review",
        design_plan: "gstack:plan-design-review",
        small_or_medium_plan: "waza:think",
        bug_or_regression: "waza:hunt",
        post_implementation_review: "waza:check",
      });
      expect(policy.context_budget.status_file).toBe(".ai/harness/context-budget/latest.json");
      expect(policy.handoff_resume.resume_packet_file).toBe(".ai/harness/handoff/resume.md");
      expect(policy.tasks.notes_dir).toBe("tasks/notes");
      expect(policy.tasks.workstreams_dir).toBe("tasks/workstreams");
      expect(policy.workstreams.scope).toBe("capability");
      expect(policy.information_lifecycle.notes.dir).toBe("tasks/notes");
      expect(policy.information_lifecycle.evidence.snapshots_dir).toBe(".ai/harness/runs");
      expect(policy.information_lifecycle.assets.promotion_rule).toContain("verified reuse across tasks");
      expect(policy.documentation.profile).toBe("minimal-agentic");
      expect(policy.lsp_profiles.default).toBe("typescript-lsp");
      expect(policy.worktree_strategy.validation_route).toBe("waza:check");
      expect(policy.sidecar_research.main_thread_policy).toContain("consume conclusions");
      const workflowContract = JSON.parse(readFileSync(join(repo, ".ai/harness/workflow-contract.json"), "utf-8"));
      expect(workflowContract.helpers.scripts).toContain("check-agent-tooling.sh");
      expect(workflowContract.helpers.scripts).toContain("switch-plan.sh");
      expect(workflowContract.helpers.scripts).toContain("check-context-files.sh");
      expect(workflowContract.helpers.scripts).toContain("maintenance-triage.sh");
      expect(workflowContract.helpers.scripts).toContain("context-budget.ts");
      expect(workflowContract.helpers.scripts).toContain("capability-resolver.ts");
      expect(workflowContract.helpers.scripts).toContain("workstream-sync.sh");
      expect(workflowContract.artifacts.requiredFiles).toContain(".ai/context/capabilities.json");
      expect(workflowContract.artifacts.requiredFiles).toContain("docs/reference-configs/agentic-development-flow.md");
      expect(workflowContract.artifacts.requiredFiles).toContain("docs/reference-configs/document-generation.md");
      expect(workflowContract.artifacts.requiredFiles).toContain(".claude/templates/implementation-notes.template.md");
      expect(workflowContract.artifacts.requiredDirectories).toContain("tasks/notes");
      expect(workflowContract.artifacts.requiredDirectories).toContain("tasks/workstreams");
      expect(workflowContract.agenticDevelopment.routing.designPlan).toBe("gstack:plan-design-review");
      expect(workflowContract.artifacts.requiredFiles).not.toContain(".ai/harness/checks/latest.json");
      expect(workflowContract.artifacts.runtimeFiles).toContain(".ai/harness/checks/latest.json");
      expect(workflowContract.artifacts.runtimeFiles).not.toContain(".ai/harness/workstreams/events.jsonl");

      const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf-8"));
      expect(pkg.scripts["check:context-files"]).toBe("bash scripts/check-context-files.sh");
      expect(pkg.scripts["check:task-sync"]).toBe("bash scripts/check-task-sync.sh");
      expect(pkg.scripts["check:task-workflow"]).toBe("bash scripts/check-task-workflow.sh --strict");

      const gitignore = readFileSync(join(repo, ".gitignore"), "utf-8");
      expect(gitignore).toContain("# BEGIN: claude-runtime-temp (managed by project-initializer)");
      expect(res.stdout).toContain("--- External Tooling ---");
      expect(res.stdout).toContain("External Tooling Report");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should remove repo-local legacy skill factory assets during migration", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-self-"));
    try {
      mkdirSync(join(repo, ".ai/hooks/lib"), { recursive: true });
      mkdirSync(join(repo, ".claude/hooks/lib"), { recursive: true });
      mkdirSync(join(repo, ".claude/skill-factory"), { recursive: true });
      mkdirSync(join(repo, "scripts"), { recursive: true });
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));
      writeFileSync(join(repo, "scripts/skill-factory-create.sh"), "#!/bin/bash\necho create\n");
      writeFileSync(join(repo, "scripts/skill-factory-check.sh"), "#!/bin/bash\necho check\n");
      writeFileSync(join(repo, ".ai/hooks/lib/skill-factory.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".ai/hooks/memory-intake.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/hooks/run-hook.sh"), "#!/bin/bash\necho generated shim\n");
      writeFileSync(join(repo, ".claude/hooks/finalize-handoff.sh"), "#!/bin/bash\necho generated shim\n");
      writeFileSync(join(repo, ".claude/hooks/session-start-context.sh"), "#!/bin/bash\necho generated shim\n");
      writeFileSync(join(repo, ".claude/hooks/custom-bash.sh"), "#!/bin/bash\necho custom\n");
      writeFileSync(join(repo, ".claude/hooks/hook-input.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/hooks/lib/workflow-state.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/hooks/lib/session-state.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/hooks/lib/skill-factory.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/hooks/memory-intake.sh"), "#!/bin/bash\necho legacy\n");
      writeFileSync(join(repo, ".claude/skill-factory/registry.json"), "{}\n");
      writeFileSync(
        join(repo, ".claude/settings.json"),
        JSON.stringify(
          {
            hooks: {
              Stop: [
                {
                  hooks: [
                    {
                      type: "command",
                      command: "bash .ai/hooks/run-hook.sh skill-factory-session-end.sh",
                    },
                  ],
                },
              ],
            },
          },
          null,
          2
        )
      );

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      expect(existsSync(join(repo, "scripts/skill-factory-create.sh"))).toBe(false);
      expect(existsSync(join(repo, "scripts/skill-factory-check.sh"))).toBe(false);
      expect(existsSync(join(repo, ".ai/hooks/lib/skill-factory.sh"))).toBe(false);
      expect(existsSync(join(repo, ".ai/hooks/memory-intake.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/run-hook.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/finalize-handoff.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/session-start-context.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/custom-bash.sh"))).toBe(true);
      expect(existsSync(join(repo, ".claude/hooks/hook-input.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/lib/workflow-state.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/lib/session-state.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/lib/skill-factory.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/hooks/memory-intake.sh"))).toBe(false);
      expect(existsSync(join(repo, ".claude/skill-factory"))).toBe(false);
      const settings = readFileSync(join(repo, ".claude/settings.json"), "utf-8");
      expect(settings).not.toContain("skill-factory-session-end.sh");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should preserve explicit external_tooling overrides while merging defaults", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-policy-merge-"));
    try {
      mkdirSync(join(repo, ".ai/harness"), { recursive: true });
      writeFileSync(
        join(repo, ".ai/harness/policy.json"),
        JSON.stringify(
          {
            version: 1,
            external_tooling: {
              hosts: ["codex"],
              mode: "strict-local",
              gbrain: { mcp: "configured" },
            },
          },
          null,
          2
        )
      );

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      const policy = JSON.parse(readFileSync(join(repo, ".ai/harness/policy.json"), "utf-8"));
      expect(policy.external_tooling.routing).toEqual({
        complex: "gstack",
        simple: "waza",
        knowledge: "gbrain",
      });
      expect(policy.external_tooling.hosts).toEqual(["codex"]);
      expect(policy.external_tooling.mode).toBe("strict-local");
      expect(policy.external_tooling.waza.primary_host).toBe("codex");
      expect(policy.external_tooling.waza.staging_cache_path).toBe("~/.agents/skills");
      expect(policy.external_tooling.codex_automation_profile.required_skills).toEqual(["health", "check", "diagram-design"]);
      expect(policy.external_tooling.codex_automation_profile.source).toBe("~/.codex/skills");
      expect(policy.external_tooling.gbrain.mcp).toBe("configured");
      expect(policy.agentic_development.routing.complex_engineering_plan).toBe("gstack:plan-eng-review");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should normalize partial tasks-first repos that still have a legacy tasks/todo.md", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-partial-tasks-"));
    try {
      mkdirSync(join(repo, "docs"), { recursive: true });
      mkdirSync(join(repo, "tasks"), { recursive: true });
      writeFileSync(join(repo, "tasks/todo.md"), "# Old Todo\n\n- [ ] existing task\n");
      writeFileSync(join(repo, "docs/TODO.md"), "- [ ] docs task\n");
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      expect(existsSync(join(repo, "tasks/archive/legacy-tasks-todo.md"))).toBe(true);
      expect(existsSync(join(repo, "tasks/archive/legacy-docs-TODO.md"))).toBe(true);

      const todo = readFileSync(join(repo, "tasks/todo.md"), "utf-8");
      expect(todo).toContain("**Source Plan**: (none)");
      expect(todo).toContain("Review imported legacy checklist below");
      expect(todo).not.toContain("Legacy Imported Task Checklist");
      expect(todo).not.toContain("existing task");
      expect(todo).not.toContain("docs task");

      const legacyTasksTodo = readFileSync(join(repo, "tasks/archive/legacy-tasks-todo.md"), "utf-8");
      expect(legacyTasksTodo).toContain("existing task");
      const legacyDocsTodo = readFileSync(join(repo, "tasks/archive/legacy-docs-TODO.md"), "utf-8");
      expect(legacyDocsTodo).toContain("docs task");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should reapply migration when .gitignore already contains a managed runtime block", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-gitignore-"));
    try {
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));
      writeFileSync(
        join(repo, ".gitignore"),
        [
          "# base",
          "# BEGIN: claude-runtime-temp (managed by project-initializer)",
          ".claude/settings.local.json",
          "# END: claude-runtime-temp",
        ].join("\n") + "\n"
      );

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      const gitignore = readFileSync(join(repo, ".gitignore"), "utf-8");
      expect(gitignore).toContain("# BEGIN: claude-runtime-temp (managed by project-initializer)");
      expect(gitignore).toContain(".claude/.task-state.json");
      expect(gitignore).toContain(".claude/.active-plan");
      expect(gitignore).not.toContain(".claude/.memory-context.json");
      expect(gitignore).toContain("# END: claude-runtime-temp");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should preserve custom settings hooks while appending missing defaults", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-merge-"));
    try {
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));
      writeFileSync(
        join(repo, ".claude/settings.json"),
        JSON.stringify(
          {
            permissions: { allow: ["Bash(git status)"] },
            hooks: {
              PostToolUse: [
                {
                  matcher: "Bash",
                  hooks: [{ type: "command", command: "bash .claude/hooks/custom-bash.sh" }],
                },
              ],
            },
          },
          null,
          2
        )
      );

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      const settings = JSON.parse(readFileSync(join(repo, ".claude/settings.json"), "utf-8"));
      expect(settings.permissions.allow).toContain("Bash(git status)");
      const postToolUse = settings.hooks.PostToolUse.flatMap((entry: any) => entry.hooks ?? []);
      const commands = postToolUse.map((entry: any) => entry.command);
      expect(commands).toContain("bash .claude/hooks/custom-bash.sh");
      expect(commands.some((command: string) => command.includes("post-bash.sh"))).toBe(true);
      expect(commands.some((command: string) => command.includes("trace-event.sh"))).toBe(true);
      expect(commands.some((command: string) => command.includes("context-pressure-hook.sh"))).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should move hooks from settings.local.json without overwriting existing arrays", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-local-hooks-"));
    try {
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));
      writeFileSync(
        join(repo, ".claude/settings.json"),
        JSON.stringify(
          {
            hooks: {
              PostToolUse: [
                {
                  matcher: "Bash",
                  hooks: [{ type: "command", command: "bash .claude/hooks/custom-existing.sh" }],
                },
              ],
            },
          },
          null,
          2
        )
      );
      writeFileSync(
        join(repo, ".claude/settings.local.json"),
        JSON.stringify(
          {
            theme: "local-only",
            hooks: {
              PostToolUse: [
                {
                  matcher: "Bash",
                  hooks: [{ type: "command", command: "bash .claude/hooks/local-only.sh" }],
                },
              ],
            },
          },
          null,
          2
        )
      );

      const res = spawnSync(
        "bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        { cwd: ROOT, encoding: "utf-8" }
      );

      expect(res.status).toBe(0);
      const settings = JSON.parse(readFileSync(join(repo, ".claude/settings.json"), "utf-8"));
      const commands = settings.hooks.PostToolUse.flatMap((entry: any) => entry.hooks ?? []).map((entry: any) => entry.command);
      expect(commands).toContain("bash .claude/hooks/custom-existing.sh");
      expect(commands).toContain("bash .claude/hooks/local-only.sh");

      const settingsLocal = JSON.parse(readFileSync(join(repo, ".claude/settings.local.json"), "utf-8"));
      expect(settingsLocal.hooks).toBeUndefined();
      expect(settingsLocal.theme).toBe("local-only");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);

  test("should not overwrite existing settings when jq is unavailable", () => {
    const repo = mkdtempSync(join(tmpdir(), "migration-no-jq-"));
    try {
      mkdirSync(join(repo, ".claude"), { recursive: true });
      writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: {} }, null, 2));
      const originalSettings = JSON.stringify(
        {
          permissions: { allow: ["Bash(git status)"] },
          hooks: {
            UserPromptSubmit: [
              {
                hooks: [{ type: "command", command: "bash .claude/hooks/custom-only.sh" }],
              },
            ],
          },
        },
        null,
        2
      );
      writeFileSync(join(repo, ".claude/settings.json"), originalSettings + "\n");

      const res = spawnSync(
        "/bin/bash",
        ["scripts/migrate-project-template.sh", "--repo", repo, "--apply"],
        {
          cwd: ROOT,
          encoding: "utf-8",
          env: {
            ...process.env,
            PROJECT_INITIALIZER_JQ_BIN: "/nonexistent/jq",
          },
        }
      );

      expect(res.status).toBe(0);
      expect(res.stdout).toContain("leaving existing file unchanged");
      const settings = readFileSync(join(repo, ".claude/settings.json"), "utf-8");
      expect(settings).toBe(originalSettings + "\n");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }, 15000);
});
