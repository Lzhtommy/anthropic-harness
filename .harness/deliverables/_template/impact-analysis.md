# [需求名称] — 影响面分析（refactor 专属，SA 产出）

## 导航头
- 文档状态：Draft / Updated

> 本阶段**不写**完整技术方案；仅评估影响面与风险。进入本阶段前 PM 必须已执行
> `bash .harness/scripts/baseline.sh snapshot`。

## 输入材料清单

（proposal / specs/_index.md 全量扫描 / codebase-guide 各子文件 / baseline snapshot）

## 受影响 specs 域清单

（逐域列出：域名 → 受影响的 Requirement/Scenario 坐标。BA 的 Spec Delta 必须逐一覆盖本清单）

## 受影响 codebase-guide 子模块

（逐文件列出）

## Baseline Snapshot 引用

（snapshot 时间与 FAIL 项基线；供 testing 阶段 baseline compare 引用）

## 风险矩阵

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|

## 拆分 / 降级建议

（影响面过大时的任务拆分或 profile 降级建议）

## 对后续阶段的输入约束

（给 BA / SA-design / RR 的硬约束）

## 结论

PASS / BLOCK（跨域矛盾 / baseline 不干净 / 影响面过大需拆分 → BLOCK）
