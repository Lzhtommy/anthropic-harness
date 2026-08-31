# [需求名称] — 代码审查报告（CR 产出）

## 导航头
- R/S 覆盖：R-xxx、S-xxx
- 文档状态：Draft / Updated

> 写入纪律：完全重写，禁止占位符残留与尾部追加。CR 不改任何代码或上游文档。

## Review 范围与覆盖维度

- 代码范围：（git diff 涉及文件）
- 相关文档：requirements / design / 就绪背书 / dev-log
- 覆盖维度：需求覆盖、方案一致性、问题归属与 PM 路由、规范与架构、安全、稳定性、可测试性、回归风险

## 问题归属与 PM 路由

（每个问题标 Dev-owned / TE-owned / Upstream-contract；即使 PASS 也写"未发现阻塞项"）

## 需求覆盖审查

（按 R-xxx/S-xxx 逐条核对实现）

## 需求覆盖度矩阵（R/S）

| Requirement | Scenario | 实现位置 | 判定 |
|---|---|---|---|

## 就绪约束一致性

（就绪背书中的阻塞/待确认项是否已关闭；未关闭必须 REJECT）

## 方案一致性

（实现与 design 偏离是否在 dev-log 说明）

## 规范合规性

（对照 .harness/rules/code-standards.md 逐条）

## 架构审查

（对照 codebase-guide 检查是否遵循项目模式、新依赖是否登记 deps.md）

## 测试覆盖检查

（区分 Dev-owned 单元/组件测试缺口 与 TE-owned E2E/cases 资产缺口）

## codebase-guide 同步

（对照 git diff 与 verify.sh C7 同源校验，不轻信 dev-log 自述）

## 必改问题（阻塞合并）

（每条含：位置 / 原因 / 影响 / 归属 / PM 路由 / 修复建议）

## 建议优化项

（收益 + 是否建议本次处理）

## 风险说明

（回归 / 运行 / 可维护 / 安全）

## 问题列表

（按 Critical / Major / Minor 分级 + 归属）

## 结论

PASS / REJECT（REJECT 须带归属：Dev-owned / TE-owned / Upstream-contract + 原因）
