---
description: Harness propose 段：初始化任务 → 人机打磨 proposal → PM 调度 BA→SA→(RR) 产出需求与方案 → 人工审批 1
argument-hint: <任务名> [需求描述]
---

# /harness-propose $ARGUMENTS

## 🔴 硬红线（全程有效）

**propose 段绝对禁止修改任何源码**：`frontend/`、`backend/`、`mcp-server/`、`e2e/`、`package.json` 全部只读。
可写路径仅 `.harness/deliverables/<任务>/*.md`（以及 board.md 的登记行）。源码改动只能由 `/harness-apply` 触发的 Developer 在 TDD 下完成。

## 执行流程

1. **解析输入**：`$ARGUMENTS` 首个合法 ASCII slug token（仅 `a-z0-9-_`，不得以 `_` 开头，禁止中文目录名）= 任务名；其余 = 需求描述。无描述 = 修订模式。
2. **初始化**：`bash .harness/scripts/init-task.sh <任务名>`（只建 proposal.md + board 登记 + baseline snapshot；目录已存在则整体跳过进修订模式）。
3. **生成 proposal 初稿**：读 `.harness/specs/_index.md`（按需读相关域）与 `.harness/codebase-guide/overview.md`，按模板生成 proposal.md 初稿。若存在关键模糊点（范围/口径/验收）**必须先反问澄清，禁止自行合理补全**。初稿按 4 步判定法给出 profile 选择 + 一句理由。
4. **修订模式**：无描述时读已有 proposal.md 继续打磨；proposal.md 缺失说明首次 init 中途失败，停下让人修复。
5. **人打磨 proposal 至满意**（对照文末定稿检查清单逐项过）。用户确认定稿后才进入下一步。
6. **切换 PM 身份**：完整读 `.harness/agents/project-manager.md`。第一件事 = Profile 识别与交叉校验（不一致立即 BLOCK 升级给人，禁止擅自切换），抛「Profile 识别」心跳。
7. **按 profile 调度 Worker**（全程六类心跳 + 四条铁律；每棒前先 `stage-doc.sh`，再用 Agent 工具拉起同名 subagent，首条消息只写 `TASK_NAME=<任务>` 等参数）：
   - quick：business-analyst(1/2) → solution-architect(2/2)（design 文末含 `## 就绪自评`）
   - standard：business-analyst(1/3) → solution-architect(2/3) → readiness-reviewer(3/3)
   - refactor：先 `[PM] 脚本事件：baseline snapshot` → solution-architect(impact, 1/4) → business-analyst(2/4) → solution-architect(design, 3/4) → readiness-reviewer(4/4)
   - 回退按 PM 契约路由表执行；BA/SA/RR 断流上限第 3 次（含首跑）
8. **暂停等人（人工审批 1）**：摘要就绪结论（standard/refactor 读 readiness-review.md；quick 读 design.md 就绪自评），board 保持 PENDING，抛：
   `[PM] ⚠ 任务 <名> 已进入人工审批 1 → 请审阅 deliverables/<名>/，确认后运行 /harness-apply <名>；不满意则改 proposal 后重跑 /harness-propose <名>`

**跨界禁止**：propose 完成后不得自主进入 apply；发现需求级问题一律升级给人。
