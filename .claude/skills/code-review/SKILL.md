---
name: code-review
description: 代码审查 SOP（CR 专用）。9 步流程 + 14 节产出格式 + 判定规则。审查维度和 REJECT 标准由 .harness/agents/code-reviewer.md 契约定义，本 Skill 只管操作步骤。
---

# code-review — 代码审查 SOP（9 步）

## Step 1 加载审查上下文

读 requirements.md + design.md + 就绪背书（standard/refactor：readiness-review.md；quick：design.md 文末 `## 就绪自评`）+ dev-log.md + codebase-guide（backend-arch / frontend-arch / deps）。

## Step 2 获取代码变更

```bash
git diff main...HEAD --stat && git diff main...HEAD
```
工作区有未提交改动时改用 `git diff HEAD --stat && git diff HEAD`（含 `git status --porcelain` 看新增文件）。无 main 分支时用 `git diff HEAD`。

## Step 3 需求覆盖度检查

按 requirements.md 的 R-xxx/S-xxx 建覆盖矩阵：每条 Scenario → 在 diff 中找对应实现位置 → 判定 ✅/❌。

## Step 4 就绪约束一致性检查

就绪背书中的阻塞/待确认项，Dev 是否在 dev-log「就绪对齐记录」逐条关闭？未关闭 → REJECT。

## Step 5 方案一致性检查

实现与 design 的偏离是否在 dev-log「偏离说明」写明？严重偏离且未说明 → Major。

## Step 6 规范与架构检查

对照 `.harness/rules/code-standards.md` 逐条 + codebase-guide 架构模式 + 依赖纪律（新依赖须登记 deps.md）。

## Step 7 codebase-guide 同步检查

对照 git diff 判断是否触及架构面路径（routes/controllers/models/middleware/app.js/main.jsx/api）；触及则 diff 中必须含 codebase-guide 更新或 dev-log 有 N/A+理由。**不轻信 dev-log 自述"已更新"。**

## Step 8 测试覆盖检查

区分：Dev-owned 单元/组件测试缺口（可 REJECT 打回 Dev）与 TE-owned E2E/cases 资产缺口（按契约的 TE-owned 分界表处理，不得打回 Dev）。

## Step 9 产出 code-review.md（14 节）

0 Review 范围与覆盖维度（含问题归属口径，PASS 也写）/ 1 问题归属与 PM 路由 / 2 需求覆盖审查 / 3 需求覆盖度矩阵 / 4 就绪约束一致性 / 5 方案一致性 / 6 规范合规性 / 7 架构审查 / 8 测试覆盖检查 / 9 codebase-guide 同步 / 10 必改问题（位置/原因/影响/归属/PM 路由/修复建议）/ 11 建议优化项 / 12 风险说明 / 13 问题列表（Critical/Major/Minor × 归属）/ 14 结论。

## 判定规则

- Dev-owned Critical/Major → REJECT（PM 打回 Developer）
- TE-owned Critical/Major → REJECT（TE-owned）（PM 路由 test-engineer，不得打回 Developer）
- requirements 与 design 冲突 / 验收口径缺失 → REJECT（Upstream-contract）
- 仅 Minor → PASS 进 TE（Minor 记录在案）
- C7 架构变更未同步且 dev-log 无 N/A 理由 → REJECT
