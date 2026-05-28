#!/bin/bash
set -euo pipefail

usage() {
  cat <<'USAGE_EOF'
Usage: scripts/sync-brain-docs.sh [--manifest PATH] (--all | --changed PATH | --check) [--scope SCOPE] [--dry-run] [--require-root]

Synchronizes stable repo knowledge into ~/brain/<project>/*.
Manifest v2 groups with lifecycle=always-sync are synced by default.
Legacy v1 entries with sync.direction=repo-to-brain remain supported.
USAGE_EOF
}

manifest_path=".ai/harness/brain-manifest.json"
mode_all=0
mode_check=0
dry_run=0
require_root=0
scope="all"
changed_paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      manifest_path="${2:-}"
      shift 2
      ;;
    --all)
      mode_all=1
      shift
      ;;
    --changed)
      changed_paths+=("${2:-}")
      shift 2
      ;;
    --check)
      mode_check=1
      shift
      ;;
    --scope)
      scope="${2:-all}"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --require-root|--require-vault)
      require_root=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "sync-brain-docs: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

resolve_js_runtime() {
  if command -v node >/dev/null 2>&1; then
    printf 'node'
    return 0
  fi
  if command -v bun >/dev/null 2>&1; then
    printf 'bun'
    return 0
  fi
  return 1
}

runtime="$(resolve_js_runtime || true)"
if [[ -z "$runtime" ]]; then
  echo "[BrainSync] Missing node or bun to read brain manifest: $manifest_path" >&2
  exit 1
fi

if [[ "$mode_all" -eq 0 && "$mode_check" -eq 0 && "${#changed_paths[@]}" -eq 0 ]]; then
  echo "sync-brain-docs: choose --all, --changed PATH, or --check" >&2
  usage >&2
  exit 2
fi

changed_json='[]'
if [[ "${#changed_paths[@]}" -gt 0 ]]; then
  changed_json="$(
    "$runtime" -e '
const values = process.argv.slice(1);
process.stdout.write(JSON.stringify(values));
' "${changed_paths[@]}"
  )"
fi

"$runtime" - "$manifest_path" "$mode_all" "$mode_check" "$dry_run" "$require_root" "$scope" "$changed_json" <<'JS_EOF'
const fs = require("fs");
const path = require("path");
const os = require("os");

const [, , manifestArg, allArg, checkArg, dryRunArg, requireRootArg, scopeArg, changedJson] = process.argv;
const repoRoot = process.cwd();
const manifestPath = path.resolve(repoRoot, manifestArg || ".ai/harness/brain-manifest.json");
const modeAll = allArg === "1";
const modeCheck = checkArg === "1";
const dryRun = dryRunArg === "1";
const requireRoot = requireRootArg === "1";
const scope = scopeArg || "all";
const brainRoot = path.resolve(process.env.REPO_HARNESS_BRAIN_ROOT || path.join(os.homedir(), "brain"));
const changedPaths = JSON.parse(changedJson || "[]").map(normalizeRepoPathInput).filter(Boolean);
let issues = 0;
let synced = 0;
let skipped = 0;

function issue(message) {
  console.log(`[BrainSync] ${message}`);
  issues += 1;
}

function warn(message) {
  console.log(`[BrainSync] warning: ${message}`);
}

function normalizeSlashes(value) {
  return String(value || "").replaceAll(path.sep, "/");
}

function normalizeRepoPathInput(value) {
  if (!value) return "";
  const raw = String(value);
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  const rel = path.relative(repoRoot, absolute);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return "";
  return normalizeSlashes(rel);
}

function safeRepoPath(value, label, id) {
  const raw = String(value || "");
  if (!raw || raw.includes("\n") || raw.includes("\r") || path.isAbsolute(raw)) {
    issue(`${label} is invalid for ${id}: ${raw || "(empty)"}`);
    return null;
  }
  const normalized = path.normalize(raw);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    issue(`${label} escapes repo for ${id}: ${raw}`);
    return null;
  }
  const absolute = path.resolve(repoRoot, normalized);
  const repoReal = fs.realpathSync(repoRoot);
  const real = fs.existsSync(absolute) ? fs.realpathSync(absolute) : absolute;
  if (real !== repoReal && !real.startsWith(`${repoReal}${path.sep}`)) {
    issue(`${label} resolves outside repo for ${id}: ${raw}`);
    return null;
  }
  return normalizeSlashes(normalized);
}

function stripWildcard(value) {
  return String(value || "").replace(/\/\*$/, "/");
}

function logicalToLocal(logicalPath, id) {
  let value = String(logicalPath || "");
  if (value.startsWith("icloud/brain/")) {
    warn(`Entry ${id} uses legacy icloud/brain/ prefix; treat it as brain/.`);
    value = `brain/${value.slice("icloud/brain/".length)}`;
  }
  if (!value.startsWith("brain/")) {
    issue(`Entry ${id} brain_path must start with brain/: ${value || "(empty)"}`);
    return null;
  }
  const rel = value.slice("brain/".length);
  if (!rel || rel.includes("\n") || rel.includes("\r") || path.isAbsolute(rel) || rel === ".." || rel.startsWith("../")) {
    issue(`Entry ${id} has invalid brain_path: ${value || "(empty)"}`);
    return null;
  }
  const local = path.resolve(brainRoot, rel);
  if (local !== brainRoot && !local.startsWith(`${brainRoot}${path.sep}`)) {
    issue(`Entry ${id} brain_path escapes brain root: ${value}`);
    return null;
  }
  return local;
}

function segmentRegex(segment) {
  const escaped = segment
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");
  return new RegExp(`^${escaped}$`);
}

function globMatches(pattern, relPath) {
  const pp = normalizeSlashes(pattern).split("/").filter(Boolean);
  const sp = normalizeSlashes(relPath).split("/").filter(Boolean);
  const memo = new Map();
  function match(pi, si) {
    const key = `${pi}:${si}`;
    if (memo.has(key)) return memo.get(key);
    let result;
    if (pi === pp.length) result = si === sp.length;
    else if (pp[pi] === "**") result = match(pi + 1, si) || (si < sp.length && match(pi, si + 1));
    else result = si < sp.length && segmentRegex(pp[pi]).test(sp[si]) && match(pi + 1, si + 1);
    memo.set(key, result);
    return result;
  }
  return match(0, 0);
}

function globBase(pattern) {
  const parts = normalizeSlashes(pattern).split("/");
  const out = [];
  for (const part of parts) {
    if (part.includes("*") || part.includes("?")) break;
    out.push(part);
  }
  return out.join("/") || ".";
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      out.push(...walkFiles(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function expandGlob(pattern, id) {
  const base = safeRepoPath(globBase(pattern), "source_glob base", id);
  if (!base) return [];
  return walkFiles(path.resolve(repoRoot, base))
    .map((file) => normalizeSlashes(path.relative(repoRoot, file)))
    .filter((rel) => globMatches(pattern, rel))
    .sort();
}

function isExcluded(relPath, exclusions) {
  return (Array.isArray(exclusions) ? exclusions : []).some((pattern) => globMatches(pattern, relPath));
}

function sourceDerivedFileName(sourcePath) {
  const parsed = path.posix.parse(sourcePath);
  if (sourcePath.startsWith("docs/reference-configs/")) return `${parsed.name}.md`;
  const stem = sourcePath.replace(/\.md$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${stem || parsed.name || "document"}.md`;
}

function logicalBrainPath(project, subdir, sourcePath) {
  return `brain/${project}/${subdir}/${sourceDerivedFileName(sourcePath)}`;
}

function syncConfig(entry) {
  const sync = entry.sync && typeof entry.sync === "object" ? entry.sync : {};
  const direction = sync.direction || entry.sync_direction || "";
  if (direction !== "repo-to-brain") return null;
  if (sync.enabled === false || entry.sync_enabled === false) return null;
  return {
    id: entry.id || "(missing id)",
    sourcePath: sync.source_path || entry.source_path || entry.repo_path,
    brainPath: sync.brain_path || entry.brain_path,
  };
}

if (!fs.existsSync(manifestPath)) {
  issue(`Missing brain manifest: ${path.relative(repoRoot, manifestPath) || manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const project = manifest.project || path.basename(repoRoot);
const defaultPrefix = stripWildcard(manifest.default_brain_path || `brain/${project}/*`)
  .replace(/^icloud\/brain\//, "brain/");
const selected = [];
const changedSet = new Set(changedPaths);

for (const group of Array.isArray(manifest.groups) ? manifest.groups : []) {
  const lifecycle = group.lifecycle || "always-sync";
  if (lifecycle !== "always-sync") continue;
  const groupScope = group.scope || group.id;
  if (scope !== "all" && scope !== group.id && scope !== groupScope) continue;
  const sources = new Set();
  for (const sourcePath of group.source_paths || []) {
    const safe = safeRepoPath(sourcePath, "source_path", group.id);
    if (safe) sources.add(safe);
  }
  const globs = Array.isArray(group.source_glob) ? group.source_glob : group.source_glob ? [group.source_glob] : [];
  for (const pattern of globs) {
    for (const rel of expandGlob(pattern, group.id)) sources.add(rel);
  }
  for (const sourcePath of Array.from(sources).sort()) {
    if (changedSet.size > 0 && !changedSet.has(sourcePath)) continue;
    if (isExcluded(sourcePath, manifest.exclusions)) continue;
    const brainPath = logicalBrainPath(project, group.brain_subdir || groupScope || "references", sourcePath);
    if (defaultPrefix && !brainPath.startsWith(defaultPrefix)) issue(`Group ${group.id} target is outside default_brain_path: ${brainPath}`);
    const targetPath = logicalToLocal(brainPath, `${group.id}:${sourcePath}`);
    if (!targetPath) continue;
    selected.push({ id: `${group.id}:${sourcePath}`, sourcePath, sourceFile: path.resolve(repoRoot, sourcePath), brainPath, targetPath });
  }
}

for (const entry of Array.isArray(manifest.entries) ? manifest.entries : []) {
  const config = syncConfig(entry);
  if (!config) continue;
  if (scope !== "all" && scope !== "entries" && scope !== config.id) continue;
  const sourcePath = safeRepoPath(config.sourcePath, "source_path", config.id);
  const normalizedBrainPath = String(config.brainPath || "").replace(/^icloud\/brain\//, "brain/");
  if (normalizedBrainPath && defaultPrefix && !normalizedBrainPath.startsWith(defaultPrefix)) {
    issue(`Entry ${config.id} brain_path is outside default_brain_path: ${normalizedBrainPath}`);
  }
  const targetPath = logicalToLocal(config.brainPath, config.id);
  if (!sourcePath || !targetPath) continue;
  if (changedSet.size > 0 && !changedSet.has(sourcePath)) continue;
  if (isExcluded(sourcePath, manifest.exclusions)) continue;
  selected.push({ id: config.id, sourcePath, sourceFile: path.resolve(repoRoot, sourcePath), brainPath: normalizedBrainPath, targetPath });
}

if (selected.length > 0 && modeCheck && !fs.existsSync(brainRoot)) {
  const message = `brain root unavailable; skipped sync drift checks: ${brainRoot}`;
  if (requireRoot) issue(message);
  else warn(message);
}
if (selected.length > 0 && !modeCheck && !dryRun) fs.mkdirSync(brainRoot, { recursive: true });

for (const entry of selected) {
  if (!fs.existsSync(entry.sourceFile)) {
    issue(`Entry ${entry.id} source file is missing: ${entry.sourcePath}`);
    continue;
  }
  if (modeCheck && !fs.existsSync(brainRoot)) {
    skipped += 1;
    continue;
  }
  const sourceContent = fs.readFileSync(entry.sourceFile, "utf8");
  const targetExists = fs.existsSync(entry.targetPath);
  const targetContent = targetExists ? fs.readFileSync(entry.targetPath, "utf8") : null;
  if (modeCheck) {
    if (!targetExists) issue(`Entry ${entry.id} brain file is missing: ${entry.brainPath}`);
    else if (targetContent !== sourceContent) issue(`Entry ${entry.id} brain file differs from source: ${entry.sourcePath} -> ${entry.brainPath}`);
    else skipped += 1;
    continue;
  }
  if (targetExists && targetContent === sourceContent) {
    skipped += 1;
    continue;
  }
  if (dryRun) {
    console.log(`[BrainSync] would sync ${entry.sourcePath} -> ${entry.brainPath}`);
    synced += 1;
    continue;
  }
  fs.mkdirSync(path.dirname(entry.targetPath), { recursive: true });
  fs.writeFileSync(entry.targetPath, sourceContent);
  console.log(`[BrainSync] synced ${entry.sourcePath} -> ${entry.brainPath}`);
  synced += 1;
}

if (issues > 0) process.exit(1);
if (selected.length === 0 && (modeAll || modeCheck)) console.log("[BrainSync] no syncable entries");
else if (synced === 0 && selected.length > 0 && !modeCheck) console.log(`[BrainSync] up to date (${skipped} checked)`);
else if (modeCheck && selected.length > 0) console.log("[BrainSync] OK");
JS_EOF
