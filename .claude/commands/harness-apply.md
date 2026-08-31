---
description: Harness apply 段：校验就绪 → PM 调度 Dev→CR→TE（TDD + 审查 + 四类测试）→ 三连验证 → AWAITING_ARCHIVE 人工审批 2
argument-hint: "[任务名] [用户反馈]"
---

# /harness-apply $ARGUMENTS

## 执行流程

1. **任务名解析**（可省略）：优先 `$ARGUMENTS` 首词匹配已有 `deliverables/<词>/` 目录；否则从 board.md 推断唯一 `IN_PROGRESS`/`AWAITING_ARCHIVE` 行；再 fallback 扫 deliverables 唯一活跃目录。推断失败 → 报错暂停。
2. **前置校验**：读 proposal.md 的 profile。standard/refactor → `readiness-review.md` 存在且文末 `## 结论 PASS`；quick → `design.md` 含 `## 就绪自评` 且文末 `## 结论 PASS`。不满足 → `[PM] ❌ /harness-apply 入口校验失败：<原因> → 暂停`。
3. **Re-run 检测**：board 状态为 `AWAITING_ARCHIVE` 或用户消息带 bug 描述 → 本次是 re-run。PM **绝对禁止自行改码**，诊断归属后调度：
   - 实现 bug / regression → 以 `上一轮结论=RE-RUN（用户反馈）: <一句现象>` 调度 developer，走 Dev→CR→TE 全链（board 改回 IN_PROGRESS）
   - E2E 用例/证据不全（TE-owned）→ 直接调度 test-engineer 补齐（跳过 Dev/CR），tester hook + PM 收口
   - 需求偏差 → 不进 apply，升级给人引导改 proposal 后 `/harness-propose`
4. **切换 PM 身份**：完整读 `.harness/agents/project-manager.md`。首条心跳用入口汇总行（见 PM 契约），board 状态改 `IN_PROGRESS`。
5. **调度 Worker（三档一致，全程六类心跳 + 四条铁律 + Task 串行）**：
   - developer（apply 1/3）：首条消息含 `TASK_NAME=` + `PROFILE=` + `就绪依据=`。收工后**硬门禁**：确认 `.harness/.hook-results/<task>--developer.json` 为 PASS 才进 CR；结果文件缺失或非 PASS → 抛异常告警并补跑 `npm run test:all` + `bash .harness/scripts/verify.sh`，补跑 PASS 才继续。FAIL 回 developer（上限第 5 次含首跑）
   - code-reviewer（apply 2/3）：REJECT 按归属路由（Dev-owned→developer；TE-owned→test-engineer；Upstream-contract→升级给人）
   - test-engineer（apply 3/3）：FAIL 按子类型路由（功能 bug→developer；需求级→升级给人；环境阻塞→PM 修环境重发 TE）
6. **apply 终点（不自动归档）**：TE PASS → 读 `.hook-results/<task>--test-engineer.json` 确认 PASS → `bash .harness/scripts/check-harness.sh` → 模板残留检测（grep 命中即按归属回退）→ 全绿后 board 改 `AWAITING_ARCHIVE`，抛异常告警心跳提示运行 `/harness-archive <任务>`。**停下——禁止自行 Spec Merge / mv / 标 DONE。**
7. **需求级失败**：停，告知人改 proposal 后 `/harness-propose`。禁止 PM 直接回 requirements。
