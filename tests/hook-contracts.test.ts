import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

describe("Hook contracts", () => {
  test("shared hook input parser should exist", () => {
    expect(existsSync(join(ROOT, "assets/hooks/hook-input.sh"))).toBe(true);
    expect(existsSync(join(ROOT, "assets/hooks/lib/workflow-state.sh"))).toBe(true);
    expect(existsSync(join(ROOT, "assets/hooks/lib/session-state.sh"))).toBe(true);
    expect(existsSync(join(ROOT, "assets/hooks/lib/memory-state.sh"))).toBe(false);
    expect(existsSync(join(ROOT, "assets/hooks/lib/skill-factory.sh"))).toBe(false);
  });

  test("shared hook dispatcher should exist", () => {
    const script = read("assets/hooks/run-hook.sh");
    expect(script).toContain("HOOK_REPO_ROOT");
    expect(script).toContain("HookRunner");
    expect(script).toContain(".ai/hooks");
  });

  test("hook input parser should support current Claude Code prompt and memory fields", () => {
    const script = read("assets/hooks/hook-input.sh");
    expect(script).toContain(".prompt");
    expect(script).toContain(".session_id");
    expect(script).toContain(".transcript_path");
    expect(script).toContain("CODEX_TRANSCRIPT_PATH");
    expect(script).toContain(".run_id");
    expect(script).toContain(".memory_type");
    expect(script).toContain(".load_reason");
    expect(script).toContain('"failure_class"');
    expect(script).toContain(".ai/harness/failures/latest.jsonl");
  });

  test("pre-code-change should protect interfaces/tests/spec truth and slice contracts", () => {
    const script = read("assets/hooks/pre-code-change.sh");
    expect(script).toContain("(interfaces|tests)");
    expect(script).toContain("docs/spec");
    expect(script).toContain("specs/");
    expect(script).toContain("tasks/contracts");
    expect(script).toContain(".spec");
    expect(script).toContain("[ExternalReference]");
    expect(script).toContain("[OpsSecret]");
    expect(script).toContain("[OpsAsset]");
  });

  test("pre-edit guard should combine asset-layer and test reminders", () => {
    const script = read("assets/hooks/pre-edit-guard.sh");
    expect(script).toContain("[AssetLayer]");
    expect(script).toContain("[BDD Guard]");
    expect(script).toContain("[TDD Guard]");
    expect(script).toContain("PlanTransitionGuard");
    expect(script).toContain("ExternalReferenceGuard");
    expect(script).toContain("OpsSecretGuard");
    expect(script).toContain("_ops/env/.env.example");
  });

  test("worktree-guard should be warning-first with marker-based enforcement", () => {
    const script = read("assets/hooks/worktree-guard.sh");
    expect(script).toContain(".claude/.require-worktree");
    expect(script).toContain("Warning: primary working tree detected");
    expect(script).toContain("Mutation blocked");
    expect(script).toContain("hook-input.sh");
    expect(script).toContain("hook_structured_error");
  });

  test("context-pressure should use stable session-id file and one-time flags", () => {
    const script = read("assets/hooks/context-pressure-hook.sh");
    expect(script).toContain(".claude/.session-id");
    expect(script).toContain("WARN_FILE");
    expect(script).toContain("RED_FILE");
    expect(script).toContain(".tool-call-count");
    expect(script).toContain("scripts/context-budget.ts");
    expect(script).toContain("prepare-codex-handoff.sh");
    expect(script).toContain("fresh-session resume packet");
    expect(script).not.toContain("/compact");
  });

  test("prompt-guard should cover Chinese bug/feature keywords and avoid emoji", () => {
    const script = read("assets/hooks/prompt-guard.sh");
    expect(script).toContain("emit_waza_route_hint");
    expect(script).toContain("[WazaRoute]");
    expect(script).toContain("Waza /check");
    expect(script).toContain("Waza /health");
    expect(script).not.toContain("Waza /hunt");
    expect(script).not.toContain("Waza /think");
    expect(script).not.toContain("Waza /learn");
    expect(script).toContain("修复");
    expect(script).toContain("修bug");
    expect(script).toContain("新功能");
    expect(script).toContain("实现");
    expect(script).toContain("执行");
    expect(script).toContain("ResearchGuard");
    expect(script).toContain("AnnotationGuard");
    expect(script).toContain("PlanStatusGuard");
    expect(script).toContain("ContractGuard");
    expect(script).toContain("ResearchGate");
    expect(script).toContain("done");
    expect(script).toContain("完成");
    expect(script).toContain("scripts/verify-contract.sh");
    expect(script).toContain("HarnessMaintenance");
    expect(script).toContain("has_changes_glob");
    expect(script).not.toContain("📋");
    expect(script).not.toContain("🧠");
    expect(script).not.toContain("📎");
  });

  test("post-edit guard should retain doc-drift coverage for apps/*/src/** and wrangler*.toml", () => {
    const script = read("assets/hooks/post-edit-guard.sh");
    expect(script).toContain("apps/[^/]+/src/.+");
    expect(script).toContain("wrangler.*\\.toml");
  });

  test("post-edit guard should combine doc drift and task handoff", () => {
    const script = read("assets/hooks/post-edit-guard.sh");
    expect(script).toContain("[DocDrift]");
    expect(script).toContain("[OpsAsset]");
    expect(script).toContain("[TaskHandoff]");
    expect(script).toContain("architecture-drift.sh");
    expect(script).toContain("context-contract-sync.sh");
    expect(read("assets/templates/helpers/workstream-sync.sh")).toContain("tasks/workstreams");
    expect(script).toContain("tasks/todo.md");
    expect(script).toContain("--quiet");
    expect(script).toContain("contract_references_path");
  });

  test("architecture drift helpers should keep detection and context sync separated", () => {
    const drift = read("assets/templates/helpers/architecture-drift.sh");
    const sync = read("assets/templates/helpers/context-contract-sync.sh");
    const workstream = read("assets/templates/helpers/workstream-sync.sh");

    expect(drift).toContain("docs/architecture/requests");
    expect(drift).toContain(".ai/harness/architecture/events.jsonl");
    expect(drift).toContain("workstream-sync.sh");
    expect(drift).not.toContain("BEGIN ARCHITECTURE CONTRACT");
    expect(sync).toContain("BEGIN ARCHITECTURE CONTRACT");
    expect(sync).toContain("Active Workstreams");
    expect(sync).toContain("discoverable_contexts");
    expect(sync).not.toContain("docs/architecture/diagrams/");
    expect(workstream).toContain("tasks/workstreams");
    expect(workstream).toContain("context-contract-sync.sh");
  });

  test("tdd-guard should use extension-based BDD/TDD heuristic", () => {
    const script = read("assets/hooks/tdd-guard-hook.sh");
    expect(script).toContain("\\.(tsx|jsx)$");
    expect(script).not.toContain("packages/scoring");
    expect(script).not.toContain("packages/wallet");
    expect(script).toContain("is_pure_barrel_file");
  });

  test("anti-simplification should parse file path via shared hook input", () => {
    const script = read("assets/hooks/anti-simplification.sh");
    expect(script).toContain("hook-input.sh");
    expect(script).toContain("hook_get_file_path");
  });

  test("settings template should not inject TOOL_INPUT/PROMPT argv blobs", () => {
    const settings = read("assets/hooks/settings.template.json");
    expect(settings).toContain("run-hook.sh");
    expect(settings).toContain(".ai/hooks/run-hook.sh");
    expect(settings).toContain("SessionStart");
    expect(settings).toContain("session-start-context.sh");
    expect(settings).toContain("pre-edit-guard.sh");
    expect(settings).toContain("post-edit-guard.sh");
    expect(settings).toContain("trace-event.sh");
    expect(settings).toContain("finalize-handoff.sh");
    expect(settings).toContain("post-bash.sh");
    expect(settings).toContain("context-pressure-hook.sh");
    expect(settings).not.toContain("memory-intake.sh");
    expect(settings).not.toContain("skill-factory-session-end.sh");
    expect(settings).not.toContain("task-handoff.sh");
    expect(settings).not.toContain("atomic-commit.sh");
    expect(settings).not.toContain('"$TOOL_INPUT"');
    expect(settings).not.toContain('"$PROMPT"');
  });

  test("trace hook should record structured JSONL events", () => {
    const script = read("assets/hooks/trace-event.sh");
    expect(script).toContain(".trace.jsonl");
    expect(script).toContain('"event_type"');
    expect(script).toContain('"run_id"');
    expect(script).toContain("session_state_resolve_key");
  });
});
