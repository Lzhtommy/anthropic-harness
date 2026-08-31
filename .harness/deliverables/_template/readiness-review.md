# [需求名称] — 开发就绪评审（RR 产出）

## 导航头
- R/S 覆盖：R-xxx、S-xxx
- 文档状态：Draft / Updated

> 写入纪律：完全重写，禁止占位符残留与尾部追加。quick 档下本文件按约定**不生成**（由 SA 在 design.md 的 `## 就绪自评` 段承担）。
> 每个 ⚠️/❌ 必须附：影响 + 建议处理方式。纯净度问题 = 硬 BLOCK。

## A. 必做检查

### 输入材料清单
（requirements.md / design.md / specs / codebase-guide，均须完稿）

### 需求检查
- 完整性：（每条 R 有 SHALL + ≥1 正向 + ≥1 异常 Scenario？）
- 纯净度：（对照 BA 禁止清单：无文件路径 / 框架名 / Schema / URL / 组件名？违规须摘录原文）
- 可验证性：（TE 能从 GWT 推出验收判据？）
- Spec Delta：（可定位、覆盖完整？refactor 档须逐一对应 impact-analysis 受影响域）

### 方案检查
- 覆盖性：（design 是否覆盖所有 R/S？）
- 结构完整性：（错误处理 / 鉴权 / 回滚降级 / Testing-only 归属拆分？）
- 关键遗漏：（refactor 档须核对 design 是否逐一回应 impact-analysis 的影响点与风险矩阵）

### 前置条件检查
- 环境 / 数据 / 权限 / 配置 / 外部依赖

## B. 可选检查（触发条件命中则必须写）

- B1 安全/稳定/可测/可运维覆盖（涉及认证授权、写操作、并发时）
- B2 落地可行性与拆分建议（改动范围大时）
- B3 高概率疑问点与隐含假设（规则复杂/口径易误解时）

## 结论

PASS / BLOCK（BLOCK 须写明打回 BA 还是 SA 及原因）

## 人工确认

- [ ] 已确认（人工审批 1：审阅后执行 /harness-apply）
