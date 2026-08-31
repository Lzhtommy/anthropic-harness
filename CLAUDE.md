# Harness Engineering 项目（Claude Code 适配版）

本仓库 = 一套完整的 Harness 研发治理框架 + 最小示例宿主项目（迷你商品目录，Express + React + JSON 存储）。
架构详解见 `.harness/GUIDE.md`；流程定义见 `.harness/workflow/flow-definition.md`。

## 核心研发纪律（第 1 层防线，全局底线）

### 三步验证底线（任何代码修改后）

1. 后端启动验证：`bash .harness/scripts/backend-smoke.sh` 通过
2. 前端构建验证：`npm run build` 无报错（或 build-stamp 命中）
3. 事后验证：`bash .harness/scripts/verify.sh` 全 PASS（退出码 0）

### 绝对禁止

- 禁止用"特殊情况 / 历史遗留 / 只改前端"等理由跳过验证
- 禁止口头汇报"完成了"——必须附脚本命令与关键输出；判定以退出码和 hook 结果文件为准
- 禁止验证未通过继续推进下游阶段
- **禁止在 /harness-propose 阶段修改任何源码**：`frontend/`、`backend/`、`mcp-server/`、`e2e/`、`package.json` 在 propose 段只读；propose 段仅允许写 `.harness/deliverables/<任务>/*.md`。源码改动只能由 `/harness-apply` 触发的 developer 在 TDD 下完成

### 文档产出

- 每阶段产出写进 `.harness/deliverables/<任务>/`，文末必须有明确 `## 结论`（PASS/BLOCK/REJECT/FAIL）
- 改数据结构（Model 字段）必须同步种子数据（`backend/data/seed/`）
- 架构面改动必须同批修订 `.harness/codebase-guide/` 受影响文档（verify.sh C7 硬校验；新子文件须登记 index.md 并挂 contract.json 对应角色 inputs）

## 细则（按角色分发，见 contract.json inputs）

- 编码规范：@.harness/rules/code-standards.md
- 流程纪律：@.harness/rules/workflow-discipline.md

## 命令入口

| 命令 | 作用 |
|---|---|
| `/harness-propose <任务> [描述]` | 需求段：init → proposal 打磨 → BA→SA→(RR) → 人工审批 1 |
| `/harness-apply [任务]` | 实现段：Dev(TDD)→CR→TE → 三连验证 → AWAITING_ARCHIVE |
| `/harness-archive [任务]` | 归档段：Spec Merge + Memory Merge + 归档 + DONE |
| `/codebase-guide-init` | 首次生成代码库知识图谱 |

## 七角色速查

PM（主会话调度，不注册 subagent，只调度不做技术判断）；Worker 六人：business-analyst / solution-architect / readiness-reviewer / developer / code-reviewer / test-engineer（注册于 `.claude/agents/`，契约全文在 `.harness/agents/`，机器契约 SSOT 在 `.harness/workflow/contract.json`）。

## 示例项目关键命令

`npm run server`（后端 5001）· `npm run client`（前端 3000）· `npm run data:import`（种子）· `npm run test:all`（全部单测）· `npm run test:e2e`（活跃 E2E 集）· `bash .harness/scripts/check-harness.sh`（框架完整性 90+ 项）
