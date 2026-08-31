---
description: Harness archive 段（人工审批 2 后显式触发）：Spec Merge + Memory Merge + 归档 + board 标 DONE + 终检
argument-hint: "[任务名]"
---

# /harness-archive $ARGUMENTS

任务名可省略：从 board.md 推断唯一 `AWAITING_ARCHIVE` 行。切换 PM 身份（读 `.harness/agents/project-manager.md`），全程六类心跳。

## 执行流程

1. **前置硬检查**（任一不满足即拒绝，未改动任何文件）：
   - `test-report.md` 文末 `## 结论` 为 PASS
   - board.md 该任务状态为 `AWAITING_ARCHIVE`
   - `.harness/deliverables/_archive/<任务>/` 不存在
   失败 → `[PM] ❌ /harness-archive 前置不满足：<原因>` 暂停。
2. **Spec Merge**：读 requirements.md 的 Spec Delta：
   - 先判域（按 `_index.md`「领域划分原则」，禁止跨域双写）
   - ADDED → 目标 spec 追加新 R+S（编号取 id_max+1 并同步上调 frontmatter id_max）；MODIFIED → 替换对应 R；REMOVED → 删除对应 R（码进 retired，id_max 不回退）；全新能力 → 创建 `specs/<域>.md`（含完整 frontmatter）
   - 同步 `_index.md` 域总览摘要行（名词短语清单，单域 5-12 个）
   - **merge 后必跑** `python3 .harness/scripts/spec-lint.py`，0 ERROR 方可继续
   - 空 Delta → 抛 `[PM] 脚本事件：Spec Merge → N/A`
3. **Memory Merge**：只扫 dev-log.md「回退/踩坑记录」的可复用经验草稿（CR/TE/RR 不写经验），逐条**原样**落 `memory/entries/YYYY-MM-DD__scope__slug.md` 并更新 `memory/index.md`。PM 不合并不改写。防复发措施声称的落地文件不存在 → 抛 `[PM] ⚠ Memory 防复发未落地：<slug> 的 <path> 不存在`（软门，不阻断）。无草稿 → N/A。
4. **归档**：`mv .harness/deliverables/<任务>/ .harness/deliverables/_archive/<任务>/`；证据目录 `.playwright-cli/_tasks/<任务>/` 一并 mv 为 `_archive/<任务>/evidence/`；随后 `python3 .harness/scripts/check-e2e-evidence.py rewrite-archived <任务>` 改写报告内证据路径。
5. **board 收尾**：状态 `AWAITING_ARCHIVE` → `DONE`（阶段保持"交付完成"）。
6. **最终验证**：`bash .harness/scripts/check-harness.sh`。PASS → 抛脚本事件心跳；FAIL → 按报错修 harness（3 轮修不动才回滚：mv 归档目录回原位 + `git checkout .harness/specs/` + board 改回 AWAITING_ARCHIVE，升级给人）。
7. **收尾心跳**：`[PM] Task project-manager 收工 → 任务 <名> 已归档 DONE`

> 本系统不提供 reject 命令：不满意按类型重跑——需求错 → 改 proposal 后 `/harness-propose`；代码 bug / E2E 不全 → `/harness-apply`；方案架构隐患但需求 OK → 改 proposal「方案提示」段后 `/harness-propose`。
