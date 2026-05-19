import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { loadWorkflowContract, resolveWorkflowContractForRepo } from "./workflow-contract.ts";

type Mode = "initialize" | "migrate" | "audit" | "repair";

type InspectionResult = {
  repo: string;
  mode: Mode;
  legacy_contract_version: string;
  drift_signals: string[];
  required_decisions: string[];
  safe_defaults: string[];
  detected_paths: string[];
};

function parseArgs(argv: string[]) {
  let repo = process.cwd();
  let format: "json" | "text" = "json";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      repo = argv[i + 1] ? resolve(argv[i + 1]) : repo;
      i += 1;
      continue;
    }
    if (arg === "--format") {
      format = argv[i + 1] === "text" ? "text" : "json";
      i += 1;
    }
  }

  return { repo, format };
}

function fileHasContent(path: string, pattern: RegExp): boolean {
  if (!existsSync(path)) return false;
  return pattern.test(readFileSync(path, "utf-8"));
}

function detectMode(repo: string): Mode {
  const hasTasks = existsSync(join(repo, "tasks"));
  const hasPlan = existsSync(join(repo, "plans"));
  const hasLegacyDocs =
    existsSync(join(repo, "docs", "plan.md")) || existsSync(join(repo, "docs", "TODO.md"));
  const hasLegacySkillFactory =
    existsSync(join(repo, ".claude", "skill-factory")) ||
    existsSync(join(repo, "scripts", "skill-factory-check.sh")) ||
    existsSync(join(repo, "scripts", "skill-factory-create.sh")) ||
    existsSync(join(repo, ".ai", "hooks", "memory-intake.sh")) ||
    existsSync(join(repo, ".ai", "hooks", "skill-factory-session-end.sh"));

  if (hasTasks && hasPlan) return "audit";
  if (hasLegacyDocs || hasLegacySkillFactory) return "migrate";
  if (!hasTasks && !hasPlan && !hasLegacyDocs) return "initialize";
  return "repair";
}

export function inspectRepo(repo: string): InspectionResult {
  const contract = loadWorkflowContract(resolveWorkflowContractForRepo(repo));
  const detectedPaths = contract.migrations.legacyPaths
    .map((relPath) => relPath)
    .filter((relPath) => existsSync(join(repo, relPath)));
  const driftSignals: string[] = [];
  const requiredDecisions: string[] = [];
  const safeDefaults = [
    "Preserve repo-local tasks-first workflow",
    "Archive uncertain legacy content instead of overwriting it",
    "Distill repeated corrections into tasks/lessons.md and hidden contracts into tasks/research.md",
  ];

  const runtimeManifest = join(repo, contract.artifacts.runtimeManifest);
  const todoFile = join(repo, contract.documents.taskChecklist);

  if (!existsSync(runtimeManifest)) {
    driftSignals.push("missing-runtime-contract-manifest");
  }
  if (existsSync(join(repo, "docs", "plan.md"))) {
    driftSignals.push("legacy-docs-plan");
  }
  if (existsSync(join(repo, "docs", "TODO.md"))) {
    driftSignals.push("legacy-docs-todo");
  }
  if (
    existsSync(join(repo, ".claude", "skill-factory")) ||
    existsSync(join(repo, "scripts", "skill-factory-check.sh")) ||
    existsSync(join(repo, "scripts", "skill-factory-create.sh")) ||
    existsSync(join(repo, ".ai", "hooks", "memory-intake.sh")) ||
    existsSync(join(repo, ".ai", "hooks", "skill-factory-session-end.sh"))
  ) {
    driftSignals.push("legacy-skill-factory-surface");
  }
  if (existsSync(join(repo, "docs", "PROGRESS.md"))) {
    driftSignals.push("legacy-docs-progress");
  }
  if (existsSync(todoFile) && !fileHasContent(todoFile, /^\> \*\*Source Plan\*\*:/m)) {
    driftSignals.push("legacy-task-checklist-format");
  }

  if (driftSignals.includes("missing-runtime-contract-manifest")) {
    requiredDecisions.push("Install runtime workflow contract manifest");
  }
  if (driftSignals.includes("legacy-docs-plan") || driftSignals.includes("legacy-docs-todo")) {
    requiredDecisions.push("Run legacy document migration before template refresh");
  }
  if (driftSignals.includes("legacy-docs-progress")) {
    requiredDecisions.push("Archive legacy docs/PROGRESS.md into task research or changelog surfaces");
  }
  if (driftSignals.includes("legacy-skill-factory-surface")) {
    requiredDecisions.push("Remove repo-local Skill Factory and auto-memory surfaces");
  }

  let legacyContractVersion = "current-v1";
  if (driftSignals.includes("legacy-docs-plan") || driftSignals.includes("legacy-docs-todo")) {
    legacyContractVersion = "pre-tasks-first";
  } else if (driftSignals.includes("missing-runtime-contract-manifest")) {
    legacyContractVersion = "tasks-first-without-contract-manifest";
  }

  return {
    repo,
    mode: detectMode(repo),
    legacy_contract_version: legacyContractVersion,
    drift_signals: driftSignals,
    required_decisions: requiredDecisions,
    safe_defaults: safeDefaults,
    detected_paths: detectedPaths,
  };
}

function renderText(result: InspectionResult): string {
  const lines = [
    `repo: ${result.repo}`,
    `mode: ${result.mode}`,
    `legacy_contract_version: ${result.legacy_contract_version}`,
    `drift_signals: ${result.drift_signals.join(", ") || "(none)"}`,
    `required_decisions: ${result.required_decisions.join(" | ") || "(none)"}`,
    `safe_defaults: ${result.safe_defaults.join(" | ")}`,
  ];
  return lines.join("\n");
}

const { repo, format } = parseArgs(process.argv.slice(2));
const result = inspectRepo(repo);

if (format === "text") {
  console.log(renderText(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}
