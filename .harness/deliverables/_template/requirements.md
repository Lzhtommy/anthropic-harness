# [需求名称] — 需求文档（BA 产出）

## 导航头
- R/S 覆盖：R-xxx、S-xxx
- specs 变更状态：Draft / Updated
- 文档状态：Draft / Updated

> 写入纪律：本文件必须**完全重写**——禁止保留任何占位符、禁止在模板尾部追加；首行 `[需求名称]` 替换为实际任务名。
> 边界铁律：只写业务规则与可观察行为（谁在什么条件下得到什么结果）。禁止：文件路径 / 框架、中间件专名 / 数据库与 Schema 细节 / URL、HTTP 动词与状态码 / 组件名。

## 功能需求

（SHALL + GWT。每条 Requirement（R-xxx）至少 1 正向 + 1 异常/边界 Scenario（S-xxx）。）

### Requirement: （名称）(R-xxx)

系统 SHALL …

#### Scenario: （名称）(S-xxx，正向)
- **Given** …
- **When** …
- **Then** …

## 非功能需求

（性能 / 安全 / 稳定性 / 兼容性；没有就写"无"并说明）

## 范围边界

- **本次要做**：
- **本次不做**：
- **默认假设**：
- **依赖条件**：

## 待确认问题（Clarifications）

（歧义 / 口径未定 / 验收不明，结构化列出）

## 成功标准

（可量化指标 + 质量门槛）

## 交接重点

（给 SA / RR / TE 各 3-5 条最容易踩坑的点）

## Spec Delta

（本次交付后需写入 specs/ 的每条变更，用规格坐标定位：业务域 → Requirement 标题 → Scenario 标题；类型 = ADDED / MODIFIED / REMOVED / 新建域文件）

## 影响面分析

（业务域 / spec 维度，不写实现文件清单）

## 结论

PASS / BLOCK（文末必须且只能是其一，BLOCK 须附原因）
