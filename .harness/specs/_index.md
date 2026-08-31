# Specs 索引 — 系统能力单一真相（SOT）

> `.harness/specs/` 始终反映系统**当前已交付**的全部能力（SHALL + GWT）。
> 每次任务归档时由 PM 按 requirements.md 的 Spec Delta 执行 Spec Merge，merge 后必跑
> `python3 .harness/scripts/spec-lint.py`（0 ERROR 方可继续）。

## 领域划分原则（划域前必读）

按 **DDD 业务域** 组织（先问"行为主语是哪个核心实体"），而非 OpenSpec 的 capability 切分：

| 类型 | 含义 | 本项目示例 |
|---|---|---|
| 一级业务域 | 围绕核心业务实体 | `products.md`（Product）/ `user-auth.md`（User） |
| 二级子域 | 数据从属父域实体但独立成文（独立成文 ≠ 升格一级域） | （暂无；如 wishlist 数据归 User） |
| 支撑域 | 只承载跨业务机制本身，不装具体界面文案 | （暂无；如 i18n 语言机制、服务端时间信号） |

**落域四原则**：
1. 先判核心实体归属（主语实体测试："系统 SHALL 让某角色看到/改变 ___"，横线处核心名词是哪个实体；一句话出现两个实体 = 两条行为 = 拆分）
2. 单一真相源：一条能力只在一处登记，禁跨文件双写
3. 界面文案归该界面所属业务域
4. 支撑域只装机制不装具体界面文案

**编号体系**：每条 Requirement/Scenario 带域前缀全局码 `<PREFIX>-R-NNN` / `<PREFIX>-S-NNN`；
全局唯一、只增不复用、退役码（frontmatter `retired`）永不启用、`id_max_*` 为历史已分配上界（含退役，REMOVED 时不回退）。

## 域总览

| 层级 | 业务域 | 文件 | 前缀 | 核心能力摘要 |
|---|---|---|---|---|
| 一级 | 商品 | `products.md` | PRD | 商品列表浏览、关键词搜索、列表排序（价格/最新）、排序地址保持、商品详情、404 退化、管理员创建商品 |
| 一级 | 用户 | `user-auth.md` | AUTH | 邮箱密码登录、令牌会话、个人信息读取、未授权拦截、管理员权限 |

## 跨域约束登记表（Constraint：什么始终为真）

| 码 | 约束 | 锚定 |
|---|---|---|
| CSTR-001 | 任何写操作 SHALL 在通过登录校验后才可执行 | AUTH-R-002 · PRD-R-004 |

## 跨域流程登记表（Flow：接下来发生什么）

跨域流程登记于 `_flows.md`（当前无条目）。

> 草案期可用 `FLOW-TBD` / `CSTR-TBD` 占位；PM 在 Spec Merge 时替换为正式码。
> **归档后 specs/ 不得残留 TBD**（spec-lint.py L7 判 ERROR）。
