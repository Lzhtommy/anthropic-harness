# Harness 架构设计详解（GUIDE）

> 本系统基于「Harness Engineering」课程完整实现（Claude Code 适配版）。
> 一句话主张：通过四层递进防线，把 Agent 交付从"不可观测的黑盒"转化为每一步可追溯、可验证、可回退的工程实践。
> 金句：**Agent 的能力上限取决于模型，交付质量的下限取决于流程。Harness 做的是抬高下限。**

## 为什么需要 Harness — AI 的 4 个结构性缺陷

1. **规则遗忘**：规范以自然语言写入，上下文越复杂遵守度越低
2. **约束规避**：Agent 天然倾向推进任务而非遵守约束（"等价替代/特殊情况豁免/历史原因保留"）
3. **自审失效**：单一 Agent 同时做需求+编码+测试，倾向确认自身输出正确
4. **虚报完成**：未完整执行验证却报告"测试通过"，缺独立机器校验时人工难辨

核心范式转换：把"是否完成"的判定依据从 Agent 自然语言报告转为**可程序化验证的客观证据**——脚本退出码、文档产出物、角色间交叉校验。

## 四层递进防线（约束力由弱到强）

| 层 | 位置 | 解决什么 | 固有局限 |
|---|---|---|---|
| 1 Rules | CLAUDE.md（全局底线）+ `.harness/rules/`（按角色分发） | 改后不验证 / 擅改上游 | 自然语言，遵守度衰减 |
| 2 Skills | `.claude/skills/*/SKILL.md`（5 个 SOP） | Rule 说"必须验证"但步骤靠临场发挥 | 仍是自然语言 |
| 3 Agents + Workflow | `.harness/agents/`（7 契约）+ `.harness/workflow/` | 单一 Agent 自审失效 | 仍属指令层 |
| 4 Scripts | `.harness/scripts/`（11 脚本）+ `.claude/hooks/`（2 dispatcher） | 前三层缺机器化验证 | —（退出码不可伪造） |

之上是**动态增长层 Memory**（`.harness/memory/`）：每踩一坑写一条五段式记忆，防复发措施落实为测试/verify 检查项，框架越用越厚。

## 关键架构决策

- **contract.json 是角色契约 SSOT**：同一契约三个视图——`.harness/agents/*.md`（Agent 读的自然语言全文）、`.claude/agents/*.md`（subagent 注册 + 必读清单）、`contract.json`（脚本可比对的结构化数据）。check-harness.sh 做三边校验，任一侧漂移 FAIL。每份 agent md 文末有 `<!-- machine-contract: ... -->` 锚点。
- **PM 不注册为 subagent**：subagent 内不能再嵌 Agent 调用；PM 在主会话扮演以保住调度能力。
- **产出者 ≠ 验收者**：写代码的人不判合格，判合格的人不改代码；验收者只以文档结论为事实依据。
- **Hook 是最后一道不可绕过的网**：SubagentStop 时独立进程重跑验证写结果文件（failClosed=false 旁路验证），Agent 插不了手；PM 只认结果文件不认自述。
- **判定不信自述，信退出码**：三层不信任强度递进——Agent 互审（语义级）→ Script 硬校验（字节级）→ Hook（时序级）。
- **propose/apply 严格隔离 + 两道人工审批**：人在就绪评审后与归档前拍板，是保持控制权的关键卡点。
- **没踩过的坑不写检查**：verify 检查项遵循"坑 → 记忆 → 防复发措施 → 检查项"正向链路，克制新增。

## 目录速查

```
.harness/
├── agents/          7 角色契约（含 machine-contract 锚点）
├── workflow/        contract.json(SSOT) · transitions.json · flow-definition.md · subagent-orchestration.md
├── scripts/         verify / baseline / check-harness / backend-smoke / init-task / stage-doc /
│                    build-stamp / ensure-playwright / check-e2e-evidence.py / spec-lint.py / codebase-guide-init
├── rules/           code-standards.md · workflow-discipline.md
├── templates/       proposal.md · codebase-guide-skeletons/
├── deliverables/    _template/（7 阶段模板）· <任务>/ · _archive/
├── specs/           _index.md · _flows.md · <域>.md（SHALL+GWT，全局码）
├── memory/          index.md · templates/entry.md · entries/
├── codebase-guide/  index · overview · backend-arch · frontend-arch · deps · dev-recipes
└── tasks/board.md   需求看板
.claude/
├── agents/          6 Worker subagent 注册
├── commands/        harness-propose / harness-apply / harness-archive / codebase-guide-init
├── skills/          build-test / post-verify / code-review / test-e2e / systematic-debug
├── hooks/           dispatch-subagent.py · dispatch-prompt.py · _actions_*.py · _subagent_payload.py
└── settings.json    hooks 挂载（SubagentStop / UserPromptSubmit）
mcp-server/          8 个 MCP 工具（Scripts 的上层封装，备用接口层）
```

## 逃生阀（应急环境变量）

| 变量 | 作用 | 事后义务 |
|---|---|---|
| `HARNESS_BYPASS=1` | 绕过 hook 阻断 | 必须补做被绕过的验证 |
| `VERIFY_SKIP_CODEBASE_GUIDE=1` | 跳过 C7 | dev-log 写明理由，CR 审计 |
| `VERIFY_FORCE_BUILD=1` / `BUILD_STAMP_DISABLE=1` | 构建缓存强制失效 | — |
| `BACKEND_SMOKE_DISABLE=1` | 跳过启动冒烟 | — |
| `PLAYWRIGHT_PRUNE_CACHE=1` | 清理旧浏览器缓存 | — |
