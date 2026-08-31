# product-sort — 代码审查报告（CR 产出）

## 导航头
- R/S 覆盖：PRD-R-005 ~ PRD-R-006；PRD-S-010 ~ PRD-S-016
- 文档状态：Updated

> 写入纪律：完全重写，禁止占位符残留与尾部追加。CR 不改任何代码或上游文档。

## Review 范围与覆盖维度

- 代码范围（`git status --porcelain` + `git diff HEAD`，工作区未提交改动，与 verify.sh C7 同源）：
  - 修改：`backend/models/productModel.js`、`backend/controllers/productController.js`、`backend/__tests__/controllers/productController.test.js`、`frontend/src/api/products.js`、`frontend/src/screens/ProductListScreen.jsx`、`.harness/codebase-guide/backend-arch.md`、`.harness/codebase-guide/frontend-arch.md`、`.harness/tasks/board.md`（流程看板，非代码面）
  - 新增（untracked，已逐文件通读）：`backend/__tests__/models/productModel.test.js`、`frontend/src/api/products.test.js`、`frontend/src/screens/ProductListScreen.test.jsx`
  - 未触碰：`e2e/`（零改动，与 dev-log 自述一致）、`backend/routes/`、`backend/app.js`、`frontend/src/main.jsx`、`frontend/src/api/client.js`、种子数据、`deps.md`
- 相关文档：requirements.md / design.md / readiness-review.md（standard 档就绪背书，结论 PASS 含 3 ⚠）/ dev-log.md
- 覆盖维度：需求覆盖、方案一致性、问题归属与 PM 路由、规范与架构（code-standards.md 逐条）、安全、稳定性、可测试性、回归风险

## 问题归属与 PM 路由

未发现阻塞项（无 Critical / Major）。本次记录 3 条 Minor，全部 Dev-owned 但均不要求本次打回；E2E 资产（T-E2E-01~05）按 design「Testing-only (test-engineer)」章节归 TE 后续阶段，经契约「TE-owned 分界」四条件逐一判定均不成立（design 未要求随代码交付、本 diff 无 e2e 改动、dev-log 未声明证据已产出、非 TE-owned 复审轮），故不构成缺陷，列为 TE follow-up。

| 归属 | 本次问题 | PM 路由 |
|---|---|---|
| Dev-owned | Minor ×3（见问题列表，不阻塞） | 无需打回；随后续任务顺带处理 |
| TE-owned | 无缺陷；T-E2E-01~05 为正常后续收口 | 路由 test-engineer 进入 E2E 验证阶段 |
| Upstream-contract | 无 | — |

## 需求覆盖审查

逐条对照 diff 核验（非听信 dev-log 自述）：

- **PRD-S-010/011/012（三种排序）**：`backend/models/productModel.js` 新增 `SORTERS` 白名单（`price_asc`/`price_desc`/`newest`），price 用 `Number()` 数值比较、newest 用 `Date.parse` 从新到旧，与 design「排序比较规则」逐字吻合。Model 层直接单测（不 mock Model）断言三正向首件与全序（`productModel.test.js` 前 3 条，锚点与种子数据一致：最低价 USB-C Hub / 最高价 iPhone 15 Pro / 最新 USB-C Hub）。✅
- **PRD-S-013（缺省默认顺序）**：`sort` 缺省或非字符串时 `sorter=null`，走原序返回，缺省分支零改动语义；排序用 `[...rows].sort` 副本，配套「不污染 store 原数组」专项断言（`productModel.test.js` 第 7 条用共享数组实测）；前端选"默认排序"时 `next.delete('sort')` 从 URL 移除键，组件测试断言 URL 变空串。✅
- **PRD-S-014（排序与关键词并存）**：`Product.find` 代码顺序固定为先 keyword 过滤后 sort 排序（结构上不可能反序）；Model 测试用 6 件商品夹具断言过滤范围不变（长度 2）且组内升序；前端 `handleSortChange` 以 `new URLSearchParams(searchParams)` 为基构造，天然保留 `keyword`，组件测试断言切换排序后请求参数与 URL 均含 keyword。✅
- **PRD-S-015（刷新/分享保持）**：`useSearchParams` 为排序状态唯一来源，初始化从 URL 读 `sort` 同步选择器与请求；组件测试用 `MemoryRouter initialEntries=['/?sort=newest']` 模拟"新开地址"，断言选择器选中与请求透传。✅（真实浏览器 reload 断言归 T-E2E-02，TE 后续收口）
- **PRD-S-016（非法值退化）**：双端白名单落实——后端 `typeof === 'string' && Object.hasOwn(SORTERS, ...)`（`__proto__`/`constructor` 原型链键、数字、null 均安全忽略，Model 测试 8 种非法值循环断言原序不抛错）；controller 测试断言非法值仍 200 且 `next` 未被调用（无 throw 路径）；前端选择器对非法值回退空值项且列表正常渲染、无 alert（组件测试第 3 条）。非法值请求仍原样透传由后端降级——与 design 异常链路时序图（`listProducts({sort:'hacked'})` → 后端忽略）完全一致。✅
- **非功能**：稳定性（无 throw 路径、cmp 恒返回 -1/0/1、脏 createdAt 按 -Infinity 排末尾有专项测试）✅；兼容性（`listProducts()` 无参调用等价现状有直接断言；响应结构 `{ products }` 不变；`GET /:id`、`POST /` 零触碰）✅；性能（内存副本排序，无新增网络往返）✅；安全（挂公开 GET，无鉴权面变化）✅。

## 需求覆盖度矩阵（R/S）

| Requirement | Scenario | 实现位置 | 判定 |
|---|---|---|---|
| PRD-R-005 | PRD-S-010 价格升序 | `productModel.js` SORTERS.price_asc；测试 `productModel.test.js`（首件最低价）、`products.test.js`、`ProductListScreen.test.jsx` | ✅ |
| PRD-R-005 | PRD-S-011 价格降序 | `productModel.js` SORTERS.price_desc；测试同上（首件最高价） | ✅ |
| PRD-R-005 | PRD-S-012 最新上架 | `productModel.js` SORTERS.newest + createdAtTime；测试断言 [5,4,3,2,1] 全序 | ✅ |
| PRD-R-005 | PRD-S-013 缺省默认顺序 | `productModel.js` 缺省分支原序 + 副本排序；`ProductListScreen.jsx` 选默认删 `sort` 键；`products.js` 空值不拼 | ✅ |
| PRD-R-005 | PRD-S-014 排序与搜索并存 | `productModel.js` 先过滤后排序（结构固定）；`ProductListScreen.jsx` 保留 keyword；三层测试各有断言 | ✅ |
| PRD-R-006 | PRD-S-015 刷新/分享保持 | `ProductListScreen.jsx` useSearchParams 唯一状态源 + useEffect 依赖 URL 参数重新请求；组件测试 initialEntries 模拟 | ✅（浏览器 reload 归 T-E2E-02） |
| PRD-R-006 | PRD-S-016 非法值退化 | `productModel.js` 白名单 + `productController.js` 透传（200 无 throw）+ `ProductListScreen.jsx` 选择器回退；三层测试各有断言 | ✅ |

7/7 Scenario 全覆盖，无孤儿实现、无越权新增能力（无组合排序/分页/销量评分排序，proposal 排除项未被引入）。

## 就绪约束一致性

readiness-review.md 结论 PASS 携 3 处 ⚠，dev-log「就绪对齐记录」逐条关闭，且我对照 diff 实证关闭动作真实存在：

1. **⚠1（R-005 异常口径并入 R-006/S-016）**：按口径实现，未双写 Scenario；Model 测试非法值用例覆盖 `hacked`/大小写错值/空串/null/数字/原型链键，异常向量（地址篡改）实覆盖。✅ 关闭
2. **⚠2（W-04 keyword 透传口径）**：人工已确认接受（就绪评审要求的人工放行确认，dev-log 记录 PM 首条消息确认）；实现按 design 读取并透传 `keyword`，口径已写入 `frontend-arch.md`「URL 契约」段（diff 实证该段存在）。✅ 关闭
3. **⚠3（排序语义须 Model 层直接断言，不得被 controller mock 架空）**：diff 实证新增 `backend/__tests__/models/productModel.test.js`，仅 mock `db/store.js`（外部依赖=文件系统），SORTERS/过滤逻辑真实执行，10 条直接断言；controller 测试文件内有注释指明语义断言落点，controller 层仅断言透传契约与响应结构。✅ 关闭（本条为就绪评审的核心整改点，落实质量高）

无未关闭阻塞项。

## 方案一致性

实现与 design 逐节吻合：组件边界（Model 白名单唯一实现点 / Controller 薄透传 / api 层 URLSearchParams / Screen useSearchParams）、调用链、接口契约（参数表、200 无错误语义、执行顺序契约）、URL 契约 4 条地址形态全部落实。dev-log「偏离说明」3 条核验：

1. 排序落 Model 而非 `backend/utils/`——design W-01 明确指定，以 design 为准，说明充分。✅
2. 新增 `frontend/src/api/products.test.js` 超出 design 列举——design 声明"无新文件（测试与 e2e 资产除外）"，属允许范围且有说明。✅
3. 新增 Model 测试文件——系兑现就绪 ⚠3 指定动作，非偏离。✅

一处未列入偏离说明的字面差异：design W-04 写"useEffect 依赖 searchParams"，实现依赖派生值 `[keyword, rawSort]`。行为等价且更精确（无关参数变化不触发重复请求），另附 `cancelled` 竞态清理属实现层稳健性增强，不改变任何契约。记 Minor 备案（问题 D-3），不构成"严重偏离未说明"。

## 规范合规性

对照 `.harness/rules/code-standards.md` 逐条：

| 条款 | 判定 |
|---|---|
| 后端 1 ES Modules 无 require（A1） | ✅ 全部 import/export |
| 后端 2/3 路由独立文件 + Controller 模式（C1/A6） | ✅ 无新路由，沿用既有链路 |
| 后端 4 asyncHandler 包裹（A2） | ✅ `getProducts` 仍为 asyncHandler 导出，仅改内部一行 |
| 后端 5 protect/admin（A7） | ✅ N/A——排序挂公开 GET，requirements 明确对所有访客开放，无缺失鉴权问题 |
| 后端 6 Model 经 store、无直接 fs（A3/C3） | ✅ 仅用 `store.read`，export default 不变 |
| 后端 7 状态码 | ✅ 非法 sort 返 200 系 PRD-S-016 明文要求（非"全返 200"违规） |
| 后端 8 无硬编码端口（A8） | ✅ diff 无端口字面量 |
| 前端 1 API 走薄封装、无裸 fetch/axios（C4/C6） | ✅ 仍经 `apiGet`，组件零 fetch |
| 前端 2 Screen 注册 main.jsx（C2） | ✅ 无新 Screen |
| 前端 3 组件测试同目录 | ✅ 三个新测试文件均与被测对象同目录 |
| 通用 1 无 console.log（A4） | ✅ diff 无残留 |
| 通用 2 单文件 ≤300 行（A5） | ✅ productModel.js 60 行、ProductListScreen.jsx 83 行 |
| 通用 3 Model 字段改动同步种子 | ✅ N/A——零字段变更 |
| 通用 4 codebase-guide 同批修订 + 新依赖登记 | ✅ 见「codebase-guide 同步」节；零新依赖 |

dev-log 附 verify.sh 实测 19 PASS / 0 WARN / 0 FAIL + baseline compare 无新增 FAIL，与上述人工核验结论一致。

## 架构审查

- **分层**：白名单校验收敛在 Model 层单点（design 关键取舍 1），Controller 保持薄透传，未在 Controller/路由散落排序逻辑。✅
- **状态管理**：未引入全局状态库，`useSearchParams` 即状态（frontend-arch"引入全局状态前先论证"约束遵守）。✅
- **依赖纪律**：零新增 npm 依赖；`useSearchParams` 来自已登记的 `react-router-dom@^6.26`，deps.md 无需变更且确未变更。✅
- **健壮性亮点**：`Object.hasOwn` 防原型链键注入（`?sort=__proto__` 安全忽略）；`typeof === 'string'` 防 express 数组型 query（`?sort=a&sort=b`）；`cancelled` 标志防 useEffect 竞态 setState。均有对应测试。
- **安全**：只读公开能力，无登录态/权限变化，CSTR-001 不受影响；非法输入面（URL 篡改）已白名单兜底。✅

## 测试覆盖检查

- **Dev-owned（本次交付义务，✅ 齐备）**：
  - Model 层 `productModel.test.js` 10 条：三正向全序断言 + 缺省原序 + 8 种非法值 + keyword+sort 组合（过滤范围不变）+ 副本不污染原序 + 脏 createdAt 不抛错 + 2 条既有行为回归（keyword 大小写不敏感）。**排序语义真实执行，未被 mock 架空**——就绪 ⚠3 的验收点成立。
  - Controller 层扩充 3 条 + 既有 keyword 用例显式化：透传契约、非法值 200 结构不变、next 未调用。
  - api 层 `products.test.js` 5 条：无参等价现状、空值不拼、单参/双参、特殊字符编码。
  - 组件层 `ProductListScreen.test.jsx` 6 条：选排序后请求参数+URL 更新+选择器同步、合法初始值、非法初始值回退且无 alert、keyword 保留、选默认删键、API 失败 alert 回归。`globals:false` 下显式 `cleanup()` 处理正确（踩坑已记录并给防复发措施）。
  - dev-log 附 TDD 红灯证据（4 轮实现前 FAIL 实录）与 `test:all` 38/38 PASS，证据链完整。
  - 同值稳定性未断言——requirements 默认假设与 design 双双声明"不作要求"，口径一致，非缺口。
- **TE-owned（非本次义务）**：`e2e/product-sort.e2e.js` + `product-sort.cases.md` + 浏览器证据（T-E2E-01~05）未交付。按契约 TE-owned 分界四条件判定：design 明确划归 test-engineer 后续阶段、本 diff 无 e2e 资产改动、dev-log 未声明 E2E 证据已产出、非 REJECT(TE-owned) 复审轮——四条件均不成立，**不算缺陷**，列 TE follow-up：真实浏览器下三种排序首件断言、`page.reload()` 保持、`/?sort=hacked` 不白屏、`/?keyword=iphone&sort=...` 组合、既有 `products.e2e.js` 回归全绿。

## codebase-guide 同步

对照 git diff 实证（不轻信 dev-log 自述）：本次触及架构面路径 `models/`、`controllers/`、`api/`、`screens/`，diff 中确含同批 guide 更新——

- `backend-arch.md`：路由表 GET / 一行式补 sort 白名单语义；Product.find 契约（先过滤后排序、副本排序、非法值静默忽略）；测试目录补 `models/` 并写明两种 mock 策略。与实现逐点一致。✅
- `frontend-arch.md`：Screen 行补 sort-select 与 useSearchParams；listProducts 签名更新；新增「URL 契约」排序 4 条地址形态 + keyword 透传口径（⚠2 备查落点）。与实现逐点一致。✅
- `deps.md`：未改，正确（零新依赖）。✅

C7 判定：同步完整、内容准确，与 verify.sh C7 PASS 同源一致。

## 必改问题（阻塞合并）

无。

## 建议优化项

1. **RTL cleanup 统一注册**（收益：消除每个新组件测试文件的显式 `cleanup()` 负担与漏写风险）：在 `frontend/vite.config.js` 加 `test.setupFiles` 统一注册 auto-cleanup。dev-log 已知遗留 1 已登记。不建议本次处理（属测试基建，独立小任务）。
2. **排序切换的局部 loading**（收益：消除 sort-select 短暂卸载导致的闪烁）：切换排序时保留列表骨架、仅局部标 loading。dev-log 已知遗留 2 已登记，design 明确本次 loading/error 路径不变，属后续 UX 任务。不建议本次处理。

## 风险说明

- **回归风险：低**。缺省分支零改动语义 + 副本排序防 store 污染均有直接测试；`listProducts()` 无参等价现状有断言；`GET /:id`、`POST /`、错误处理链路零触碰；baseline compare 无新增 FAIL。剩余回归面（详情跳转、列表加载失败提示的真实浏览器行为）由 T-E2E-05 收口。
- **运行风险：低**。无迁移、无配置、无新依赖；回滚纯 revert，旧分享地址 `?sort=` 回滚后自然降级默认顺序。
- **可维护风险：低**。排序语义单点收敛 Model 层，guide 已同步；唯一隐患是 `globals:false` 的 cleanup 约定依赖开发者自觉（见建议优化 1）。
- **安全风险：低**。只读公开接口；原型链键与非字符串 query 已防御并有测试。

## 问题列表

| # | 级别 | 归属 | 问题 | 位置 | 影响 | 处理 |
|---|---|---|---|---|---|---|
| D-1 | Minor | Dev-owned | RTL auto-cleanup 依赖各测试文件显式 `cleanup()`，新文件易漏写 | `frontend/vite.config.js`（test.globals:false）/ `ProductListScreen.test.jsx:40` | 后续新增组件测试若漏写会跨用例 DOM 累积误报 | 记录在案，后续以 setupFiles 统一；防复发措施已入 dev-log 踩坑记录 |
| D-2 | Minor | Dev-owned | 切换排序走整页 Loading 替换，sort-select 短暂卸载有闪烁 | `frontend/src/screens/ProductListScreen.jsx:58` | 仅观感，不影响任何 PRD 断言 | design 明确本次不改 loading 路径；列后续 UX 任务 |
| D-3 | Minor | Dev-owned | useEffect 依赖用派生值 `[keyword, rawSort]` 而非 design 字面的 searchParams，未列入 dev-log 偏离说明 | `frontend/src/screens/ProductListScreen.jsx:46` | 无行为差异（等价且更精确）；仅文档记录完整性瑕疵 | 备案即可，无需整改 |

Critical：0；Major：0（含 TE-owned）；Minor：3（均不阻塞）。

## 结论

PASS

- 需求覆盖矩阵 7/7 全 ✅，无 Critical/Major（Dev-owned 与 TE-owned 均无）；就绪背书 3 处 ⚠ 逐条关闭且经 diff 实证；偏离均有说明或属等价实现；code-standards 逐条合规；codebase-guide 同步与 C7 diff 扫描一致；零新依赖。
- 3 条 Minor 记录在案（D-1/D-2/D-3），均不阻塞合并。
- 进入 TE 阶段收口项：T-E2E-01~05（e2e/product-sort.e2e.js + cases.md 1:1 对照 + 浏览器证据），属正常后续交付义务，非缺陷。
