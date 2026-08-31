# 流程定义（人读版）

> 机器读版见 `transitions.json`；角色契约 SSOT 见 `contract.json`。

## 三段命令接力 + 两道人工审批

```
═══ 阶段 0：需求澄清 ═══
init-task.sh 创建任务目录 + proposal.md（其余模板由 stage-doc.sh 按需拉）
人机多轮对话打磨 proposal.md → 消除歧义 → 声明流程 profile → 定稿确认

═══ /harness-propose <任务> ═══
PM 扮演后第一件事 = Profile 识别与交叉校验（不符立即 BLOCK）
① BA → requirements.md（SHALL + GWT，禁止实现细节）
② SA → design.md（需求→技术落实对照 + Tasks；quick 档文末加 ## 就绪自评）
③ RR → readiness-review.md（纯净度 + 覆盖度）— quick 档跳过；refactor 档在 ① 前
   增加 ⓪ SA → impact-analysis.md（PM 先跑 baseline.sh snapshot）

🔒 人工审批 1：审阅 deliverables 后执行 /harness-apply <任务>

═══ /harness-apply <任务> ═══
④ Dev → TDD 实现 + dev-log.md → SubagentStop hook 旁路验证（test:all + verify.sh）
⑤ CR → code-review.md（R/S 逐条核对 git diff）
⑥ TE → test-report.md（A/B/C/D 四类，B 类真实浏览器）→ hook 旁路验证
⑦ PM 读 hook 结果 → check-harness.sh → 模板残留检测 → board 改 AWAITING_ARCHIVE（停）

🔒 人工审批 2：审阅后执行 /harness-archive <任务>

═══ /harness-archive <任务> ═══
⑧ PM → Spec Merge（+spec-lint 门禁）+ Memory Merge + mv 归档 + board 标 DONE + check-harness 终检
```

## 三档 Profile（4 步判定法，拿不准往上走一档）

```
Step 1  列出本次会碰的 specs 域        → 数量 ≥2？        → YES = refactor，停
Step 2  改数据模型 / 破坏 API 兼容性？  → YES = refactor，停
Step 3  新 API / 新字段 / 新 npm 依赖？ → YES = standard，停
Step 4  以上都 NO                     → quick
```

| Profile | propose 段调度链 | 差异 |
|---|---|---|
| quick | BA → SA（design 含 `## 就绪自评`） | 跳过 RR Task；人工卡点改读自评段 |
| standard | BA → SA → RR | 默认档 |
| refactor | SA(impact) → BA → SA(design) → RR | 前置 impact-analysis；PM 先跑 baseline snapshot |

apply 段三档完全一致：Dev → CR → TE。

## 六条流程铁律

1. **下游不改上游**：每个角色只改自己阶段的产出物；发现上游问题唯一动作是标 BLOCK/REJECT/FAIL 由 PM 路由
2. **PM 只做调度**：读结论/发 Task/处理回退/跑脚本/Spec Merge；不写需求、不定方案、不评价代码
3. **每棒必须有文档**：没有文档 = 没完成；口头汇报不算；文档末尾必须有明确 `## 结论`
4. **propose ↔ apply 不可自主跨越**：propose 完成后暂停等人执行 /harness-apply；apply 中发现需求级问题升级给人，禁止自主跨回
5. **propose 段禁止碰源码**：可写路径仅 `.harness/deliverables/<任务>/*.md`；源码改动只能由 /harness-apply 的 Developer 在 TDD 下完成
6. **PM 实时事务 + Task 串行**：一心跳一工具一结果；同一时刻只跑一棒

## 阶段结论统一口径

| 结论 | 语义 | 产出角色 |
|---|---|---|
| BLOCK | 输入不完整或硬校验未满足，禁止流转 | BA / SA / RR |
| REJECT | 代码审查未通过（必须标 Dev-owned / TE-owned / Upstream-contract） | CR |
| FAIL | 测试未通过（区分 功能 bug / 需求级 / 环境阻塞 / 定位阻塞） | TE |
| PASS | 当前阶段通过 | 所有角色 |

## 为什么没有 reject 命令

命令语义自带方向：需求错 → 改 proposal 重跑 `/harness-propose`；代码 bug / E2E 不全 → 重跑 `/harness-apply`；方案架构隐患但需求 OK → 改 proposal「方案提示」段 → `/harness-propose`（触发 SA 重出 design，不改 requirements）。

## 故障处理

| 场景 | 处理 |
|---|---|
| 同一 Worker 第 3 次仍未收敛（Developer 第 5 次） | 停止流程，升级给人 |
| Worker 超时 | PM 决定是否重发同一 Worker |
| apply 段发现需求级问题 | PM 暂停，告知人改 proposal 后重跑 /harness-propose |
| archive 后 check-harness FAIL 3 轮修不动 | 回滚（mv 回原位 + git checkout specs + board 改回 AWAITING_ARCHIVE）并升级给人 |
