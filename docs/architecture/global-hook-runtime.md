# Global Hook Runtime

> **Status**: Phase 0 — Operational Smoke (data filled 2026-05-28; manual-only items still pending)
> **Plan**: `plans/plan-20260528-1436-hook-global-runtime.md`
> **Contract**: `tasks/contracts/hook-global-runtime.contract.md`
> **Notes**: `tasks/notes/hook-global-runtime.notes.md`
> **Canary**: `scripts/canary-global-hook.sh`
> **Generated**: 2026-05-28, operator: ancienttwo (canary log 711 lines, time window 15:23–17:04 +08:00; includes post-Codex-restart trust observations at 17:03)
> **Repo set used for canary**: `/Users/ancienttwo/Projects/repo-harness` (opt-in, this repo), `/Users/ancienttwo/Astrozi` (opt-in). **Gap**: no non-opt-in repo yet — pending manual run to confirm dual-fire vs single-fire branching.

## Purpose

Document the operational behavior of `repo-harness` global hook runtime when
installed at the host level (Codex `~/.codex/hooks.json` + Claude
`~/.claude/settings.json`). Phase 0 fills the Host Operational Matrix and the
Trust UX sections from real host smoke; Phase 1 fills Migration Guide and
Failure Mode from the CLI implementation.

This document is **not** a substitute for the plan or contract. The plan owns
strategy; the contract owns scope and exit criteria; this document owns
observed runtime behavior of the two hosts under user-level hook installation.

## Phase 0 Verification Setup

- Canary script: `scripts/canary-global-hook.sh`
- Events instrumented: `SessionStart`, `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`
- Per-fire side effect: append one line to `~/.repo-harness-canary.log`
  - Format: `[repo-harness-canary] host=<codex|claude> event=<name> repo=<path> ts=<iso>`
- Host slots written:
  - `~/.codex/hooks.json` (Codex global)
  - `~/.claude/settings.json` (Claude user-level)
- Backups (first install only): `<file>.repo-harness-canary-backup`
- Trust registration surface to grep: `~/.codex/config.toml [hooks.state]` (user-level path keys only)

Procedure:

1. `bash scripts/canary-global-hook.sh install`
2. Restart Codex; observe trust prompt UX; accept or decline (test both)
3. Restart Claude Code, or rely on `ConfigChange` auto-reload
4. Trigger each instrumented event in 2-3 repos (mix: opt-in + non-opt-in)
5. `bash scripts/canary-global-hook.sh status` — tagged entry count per host + Codex user-level hash count
6. `bash scripts/canary-global-hook.sh tail` — live log
7. Record observations in this document
8. `bash scripts/canary-global-hook.sh uninstall`

## Host Operational Matrix

| # | Observation | Codex (`~/.codex/hooks.json`) | Claude (`~/.claude/settings.json`) |
|---|-------------|-------------------------------|------------------------------------|
| 1 | **加载** — global hook 是否被 host 调度层 fire（在任意 repo 触发对应 event 时 canary log 是否出现 `host=<X>` 行） | ✅ **522 + 2 fires** across both repos. Pre-restart per event: SessionStart=6, UserPromptSubmit=6, PreToolUse=254, PostToolUse=252, Stop=4. **Post-restart (17:03:44 Astrozi)**: SessionStart=1, UserPromptSubmit=1 confirming reload + new-entry trust. First fire: `2026-05-28T15:35:05` (repo-harness). Last fire: `2026-05-28T17:03:44` (Astrozi). Source: `~/.repo-harness-canary.log` lines tagged `host=codex`. | ✅ **169+ fires** across both repos (continuing live). Per event (pre-17:04 sample): SessionStart=3, UserPromptSubmit=10, PreToolUse=74, PostToolUse=72, Stop=10. First fire: `2026-05-28T15:23:01`. Most recent: `2026-05-28T17:04:12` (this session). Source: same log, `host=claude`. |
| 2 | **Trust prompt UX** — 首次安装后启动 host 是否弹 trust prompt？形态如何（CLI 提示 / Settings UI / 静默接受）？拒绝路径是什么？ | ✅ **Per-new-entry prompt confirmed** (2026-05-28T17:03 manual restart). User reports: "已重启授权 5 个新 HOOK" — Codex 对 5 个新 canary entries 分别弹了 5 个独立 trust prompt; 已存在的 11 条 shim hash 静默通过未 re-prompt. Hash count 立即 11 → 16. **Still manual-only**: prompt 文案 / UI surface (CLI 提示 vs Settings UI) / 拒绝路径行为. To capture: edit one canary `echo` command string in `~/.codex/hooks.json`, restart Codex, screenshot the prompt; decline branch separately. | N/A — Claude 文档明确无 trust re-prompt 机制 (`code.claude.com/docs/en/settings.md`); 169 silent fires confirm. |
| 3 | **Hash 注册** — 接受 trust 后是否在 `~/.codex/config.toml [hooks.state]` 下出现 user-level path key (`/Users/<user>/.codex/hooks.json:<event>:<i>:<j>`)？hash 命中时是否跳过重复 prompt？ | ✅ **16 entries observed** (post-canary-restart, lines 498–543 in `config.toml`). Key format confirmed: `<absolute-path>:<event-snake-case>:<i>:<j>` where `i` = index into `hooks[<event>]` array, `j` = index into `hooks[<event>][i].hooks[]` nested array. **Pre-canary** entries (11, from Phase 0.5 shim): `pre_tool_use:0:0`, `pre_tool_use:0:1`, `post_tool_use:0:0`/`0:1`/`1:0`/`2:0`/`3:0`, `session_start:0:0`, `user_prompt_submit:0:0`/`0:1`, `stop:0:0`. **New canary** entries (5, appended at i=N+1): `pre_tool_use:1:0`, `post_tool_use:4:0`, `session_start:1:0`, `user_prompt_submit:1:0`, `stop:1:0`. ✅ **Hash-skip confirmed**: 重启 Codex 后 11 条 shim hash 全部静默通过, only the 5 new canary entries triggered fresh trust prompts. Key takeaway: Codex hashes `(canonical command string, event-key-with-indices)` and only prompts on new combinations. | N/A |
| 4 | **Auto-reload** — 修改 hook config 文件后是否需要重启 host，还是 host 自动 pickup？Claude 是否触发 `ConfigChange` event？ | ✅ **Restart-time reload confirmed** (17:03:44 Astrozi: post-canary-install Codex restart → SessionStart + UserPromptSubmit canary fires immediately). 🔶 **Mid-session reload untested**. To test: edit one canary `echo` text in `~/.codex/hooks.json` while Codex session is live, trigger PreToolUse without restart, check log for updated text. | ✅ **Auto-reload confirmed at install time**: 16:51:47 PreToolUse canary fire happened seconds after I wrote `~/.claude/settings.json` (no Claude restart between write and fire). ConfigChange auto-pickup verified. 🔶 **Time-from-write delta** (秒级 vs reload-on-next-event) still needs explicit measurement via mtime delta. |
| 5 | **拒绝 trust 后行为** — 用户拒绝 trust 时 host 行为：silent skip / 报错 / 阻塞 event？后续如何重新启用？ | **Manual-only**: never refused. To test: temporarily edit one command string, restart Codex, decline trust prompt (if it appears), observe behavior. Note for safety: do this in a scratch hook entry, not on the real PreToolUse guard. | N/A |

Fill rule: rows 1 and 3 are evidence-driven (canary log + config.toml). Rows
2/4/5 still carry `Manual-only` markers because they require interactive UX
observation that the canary log cannot capture (trust prompt text, reject
flow, reload timing). Address these by running the 4 micro-tests listed
inline above before declaring Phase 0 fully closed.

## Dual-Fire Note (Design Expected, Not Anomaly)

During Phase 0, opt-in repos (including this self-host repo) still carry a
project-level `.codex/hooks.json` and a project-level `.claude/settings.json`
hooks segment that dispatch the real `.ai/hooks/run-hook.sh` guards. When the
canary is installed globally **and** the user triggers an event inside an
opt-in repo, both fire:

- Project-level hook → real guard (writes `.ai/harness/*`, etc.)
- Global canary → echo into `~/.repo-harness-canary.log`

This is the expected Phase 0 state, not a regression. Claude documents this
as "merging, not overriding" across scopes
(`code.claude.com/docs/en/hooks.md`). To observe a clean global-only fire,
trigger events in a **non-opt-in repo** (any repo without
`.ai/harness/workflow-contract.json`).

Phase 1 reframes this: project-level adapters become deprecated fallback
shims, and the `repo-harness hook` dispatcher (called from the global slot)
becomes the single canonical entrypoint.

## Trust UX — Codex

Partially observed from canary install; manual UX-only items remain.

**Confirmed (data-driven):**

- ✅ `[hooks.state]` key format: `<absolute-path>:<event-snake-case>:<i>:<j>` where `i` indexes the per-event hooks array and `j` indexes the nested `hooks[].hooks[]` array. Same format applies to user-level and project-level paths (compare `~/.codex/hooks.json:...` entries to existing project-level entries in the same `config.toml`).
- ✅ User-level hash registration works: **16 entries** under `[hooks.state."/Users/ancienttwo/.codex/hooks.json:..."]` after canary install + Codex restart + user trust acceptance (was 11 pre-canary, +5 for new canary entries).
- ✅ Once trust is registered, fires happen silently (522+ codex fires without UX interruption in the canary window; post-restart fires at 17:03:44 Astrozi also silent).
- ✅ **Per-new-entry trust prompt**: Codex restart after canary install showed 5 distinct trust prompts (one per new `(command, key)` combination); the 11 preexisting shim hashes silently passed without re-prompt. User reported manual acceptance: "已重启授权 5 个新 HOOK" (2026-05-28T17:03).
- ✅ **Hash sensitivity to (command, key) tuple confirmed**: appending new entries to existing event arrays produced new `i` indices (`pre_tool_use:1:0`, `post_tool_use:4:0`, `session_start:1:0`, `user_prompt_submit:1:0`, `stop:1:0`), each triggering its own prompt. Implication: any change to either the command string or the array position will re-trust-prompt.
- ✅ **Uninstall does not GC `[hooks.state]` residual hashes** (2026-05-28T17:11 confirmed): `bash scripts/canary-global-hook.sh uninstall` removed all 5 canary entries from `~/.codex/hooks.json` (verified canary status `installed: 0/5`), but `[hooks.state]` retained all 16 user-level entries (lines 498–543). Implication: re-installing identical canary commands at identical `(event, i, j)` positions should hash-match and skip prompt. Operator must manually edit `config.toml` to revoke stale trust.

**Still manual-only — answer by running the micro-tests below:**

- 提示文案 + UI surface（CLI 内 prompt 还是 Settings UI 入口）
  - **Micro-test**: 下次 install canary 前先 `canary uninstall`，再 install，restart Codex，截屏/抄录 prompt 文案和出现位置；本次实测仅有"5 个新 HOOK 授权"的口头描述，没有原始 prompt 文本。
- 拒绝路径：之后还能重新启用吗？需要重启 Codex 还是改 config.toml？
  - **Micro-test**: 临时编辑一条 canary entry 的 echo 字符串（不影响真 shim），restart Codex，在 prompt 弹出时 decline；触发 event 看 canary log 是否新增行；grep `config.toml [hooks.state]` 看 decline 是否被记录。
- Command 字符串内部小改是否触发新 prompt？（已知 append 新 entry 会触发；同一 (i,j) 改 command 待测）
  - **Micro-test**: 编辑 `~/.codex/hooks.json` 中现存某 canary entry 的 echo 文本（加尾随空格即可），restart Codex，看是否对该 `:<i>:<j>` key 弹新 prompt。

## Trust UX — Claude

Claude Code user-level hooks 不使用 trust 机制：

- `~/.claude/settings.json` 是 documented user-level config，所有 event
  types（PreToolUse / PostToolUse / SessionStart / UserPromptSubmit / Stop /
  Notification / SubagentStart / Stop / FileChanged / ConfigChange）在 user
  级都支持。
- Merging precedence: `managed > local (.claude/settings.local.json) > project (.claude/settings.json) > user (~/.claude/settings.json)`。
  同一 event 在多个 scope 都有 hook 时，**所有 scope 的 hook 都 fire**
  (merging, not override)。
- 配置变更**自动 reload**，触发 `ConfigChange` event，无需重启 Claude
  Code。
- 引用：`code.claude.com/docs/en/settings.md`, `code.claude.com/docs/en/hooks.md`
  (verified 2026-05-28 via `claude-code-guide` subagent)。

Phase 0 观察结果：

- ✅ **Merging precedence verified at user level**: 169 user-level canary fires happened alongside project-level real-guard fires in opt-in repos (repo-harness + Astrozi). Same event triggers both. This confirms `user > project` merging works as documented (not override).
- 🔶 **ConfigChange 秒级触发**: still **manual-only**. Implied by 169 fires over 1h36m with no obvious restart, but not measured.
  - **Micro-test**: write a no-op change to `~/.claude/settings.json` (e.g. reorder a JSON key without changing semantics), then immediately trigger a `PreToolUse` event, measure delta between file mtime and next canary log line.

## Migration Guide

(Phase 1 填入: `repo-harness install` / `repo-harness migrate <repo>` 行为说明)

预期覆盖:

- 新 repo init: 不再写项目级 `.codex/hooks.json` 或 `.claude/settings.json` hooks 段
- 老 repo 升级: `repo-harness migrate <repo>` 把旧 hook 段降级为 fallback shim 或删除
- Contract bump: `hookRuntime: { mode: 'global-cli' | 'project-adapter', minCliVersion }` 字段语义
- 自迁移 repo-harness 自身的步骤与验证

## Failure Mode

(Phase 1 填入: 各失败路径与诊断命令)

预期覆盖:

- CLI 未安装时全局 adapter 行为
- 用户拒绝 trust 后的降级路径
- repo 缺 opt-in marker 时的 silent exit 0 验证
- `repo-harness doctor` 输出格式与检测维度
- PATH 问题（CLI 不在 PATH 上）与 host 报错形态
- 两 host 仅装其一时的 install/status 一致性

## References

- 上游设计参考: `_ref/codegraph` @ commit `02935d77`
  (`src/installer/targets/registry.ts:20-29`, `src/installer/targets/codex.ts:40,46,57-59`,
  `src/installer/targets/types.ts:15,51-62`, `install.sh`, `install.ps1`)
- Codex hooks 文档与实证: `~/.codex/config.toml` `[features] hooks = true` (lines 23/138/171),
  `[hooks.state]` (lines 404+), Codex CLI 0.130.0
- Claude hooks 文档: `code.claude.com/docs/en/settings.md`, `code.claude.com/docs/en/hooks.md`
- 项目内相关 module: `docs/architecture/modules/runtime-harness/hook-adapters.md`
- 项目内相关 domain: `docs/architecture/domains/runtime-harness.md`
- 历史决策: `tasks/notes/codex-hook-adapter.notes.md`,
  `tasks/notes/hook-global-runtime.notes.md`
