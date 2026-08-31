# product-sort — 开发日志（Dev 产出）

## 导航头
- R/S 覆盖：PRD-R-005 ~ PRD-R-006；PRD-S-010 ~ PRD-S-016
- 文档状态：Updated

## 实现摘要

按 design.md W-01~W-05 实现商品列表排序：

- **后端**：`Product.find` 新增 `sort` 白名单排序（`price_asc`/`price_desc`/`newest`），契约为先 keyword 过滤、后排序，副本排序（`[...rows].sort`）不污染 store 原序；白名单外任意值（含 `__proto__`/`constructor` 原型链键）静默忽略、无 throw 路径。Controller 薄透传 `req.query.sort`，响应结构 `{ products }` 不变。
- **前端**：`listProducts({keyword, sort})` 用 `URLSearchParams` 拼查询串（空值不拼，无参等价现状）；`ProductListScreen` 新增 `<select data-testid="sort-select">`（默认排序/价格从低到高/价格从高到低/最新上架），以 `useSearchParams` 为排序状态唯一来源：非法 sort 值选择器回退默认项但原样透传由后端降级、选默认时删除 `sort` 键、切换排序保留 `keyword`，`useEffect` 依赖 URL 参数重新请求。
- **TDD 六步**：4 个 red-green 循环（Model → Controller → api 层 → Screen），每轮先写测试实测 FAIL 再实现（红灯证据见「验证证据链」）。新增/扩充单测共 21 条（Model 10 + Controller 4 + api 5 + Screen 6，另 2 条既有 controller 用例保持）。

## 偏离说明

1. **排序逻辑落点**：`dev-recipes.md`「查询参数类功能」建议纯函数放 `backend/utils/`，但 design W-01 明确指定实现在 `backend/models/productModel.js`（"排序与过滤同层收敛"取舍）。以 design 为准，未新建 utils 文件。
2. **新增测试文件超出 design 列举**：`frontend/src/api/products.test.js`（design 仅列 controller 扩充与 Screen 组件测试）。design 声明"无新文件（测试与 e2e 资产除外）"，属允许范围；目的是让 W-03 查询串构造契约有直接断言。
3. **新增 `backend/__tests__/models/productModel.test.js`**：非偏离而是兑现 readiness-review ⚠3 的指定动作（排序语义须在 Model 层建立不 mock Model 的直接断言），该文件仅 mock `db/store.js`（外部依赖=文件系统），排序/过滤逻辑真实执行。

其余与 design 完全一致：无新路由、无新依赖、未改 main.jsx / client.js / 种子数据 / e2e 资产（e2e/ 目录零触碰）。

## 代码变更清单

| 文件 | 操作 | 对应 R/S | 说明 |
|---|---|---|---|
| `backend/models/productModel.js` | 修改 | PRD-R-005 / S-010~014、S-016 | W-01：白名单 SORTERS + 副本排序；`Object.hasOwn` 防原型链键；createdAt 解析 NaN 按 -Infinity 排 newest 末尾，无 throw |
| `backend/__tests__/models/productModel.test.js` | 新增 | S-010~014、S-016 | 兑现就绪 ⚠3：只 mock store，10 条直接断言（三正向/缺省/非法值含原型链键/keyword+sort 组合/不污染原序/脏 createdAt/既有 keyword 回归） |
| `backend/controllers/productController.js` | 修改 | PRD-R-005 / S-010~014、S-016 | W-02：`getProducts` 透传 `req.query.sort`，响应结构不变 |
| `backend/__tests__/controllers/productController.test.js` | 修改 | S-010~014、S-016 | W-02：新增 sort 透传 ×2、非法值 200 结构不变 ×1；既有 keyword 用例改为显式含 `sort: undefined` |
| `frontend/src/api/products.js` | 修改 | PRD-R-005、R-006 | W-03：`listProducts({keyword, sort})` URLSearchParams 构造，空值不拼，无参等价现状 |
| `frontend/src/api/products.test.js` | 新增 | S-013~014 | W-03 契约断言 5 条（mock client.js） |
| `frontend/src/screens/ProductListScreen.jsx` | 修改 | PRD-R-005~006 / S-010~016 | W-04：sort-select + useSearchParams 读写 + 依赖 URL 重新请求；loading/error 既有路径不变 |
| `frontend/src/screens/ProductListScreen.test.jsx` | 新增 | S-013~016 | W-05：6 条组件测试（MemoryRouter + mock api），含显式 `cleanup()`（见回退/踩坑记录） |
| `.harness/codebase-guide/backend-arch.md` | 修改 | — | C7 同步：路由表 GET / 调用链、Product.find 契约、测试目录含 models/ |
| `.harness/codebase-guide/frontend-arch.md` | 修改 | — | C7 同步：Screen 描述、listProducts 签名、URL 契约段（排序 4 条地址形态 + keyword 透传口径） |

## 就绪对齐记录（强制）

readiness-review.md 结论 PASS，三处 ⚠ 逐项关闭：

1. **⚠（A 节完整性）R-005 无独立异常 Scenario，异常向量由 PRD-S-016 承载**：按口径实现——非法 sort 的退化路径覆盖"地址被篡改"来源（后端白名单 + 前端选择器回退双端），Model 测试的非法值用例显式覆盖 `hacked`/大小写错值/空串/null/数字/原型链键；无需新增 Scenario。
2. **⚠（B3-1）URL keyword 透传口径**：PM 首条消息已确认人工口径"接受 W-04 兑现既有规约 PRD-R-002，不视为兼容性破坏"。已按 design 实现 ProductListScreen 读取并透传 `keyword`，组件测试断言切换排序保留 keyword；该口径已同步写入 frontend-arch.md「URL 契约」段备查。
3. **⚠（A 节测试落点）排序语义断言不得只放在 mock 掉 Model 的 controller 测试**：已新增 `backend/__tests__/models/productModel.test.js`，仅 mock `db/store.js`，排序纯逻辑真实执行并直接断言；controller 测试文件内加注释指明语义断言所在，controller 层只断言透传契约与响应结构。

无未关闭阻塞项。

## 回退/踩坑记录（被打回时强制；Dev 是 memory 唯一作者）

本任务首轮一次通过（未被 CR/TE 打回）。开发过程中有一次组件测试 FAIL，已按 systematic-debug SOP 处理（memory 检索未命中 → 读全错误 → 单一假设最小修复一次通过），属模式性坑，按 SOP 收尾留草稿供 PM 裁量（按"一次通过的任务不写"规则可不归档）：

- **症状**：`ProductListScreen.test.jsx` 第 2 个及之后用例报 `Found multiple elements by: [data-testid=...]`，首个用例通过。
- **根因**：`frontend/vite.config.js` 设 `test.globals: false`，@testing-library/react 的 auto-cleanup 依赖全局 `afterEach` 存在才注册，故跨用例 DOM 未卸载、渲染树累积。既有 `Price.test.jsx` 因两条用例断言文本互不相同而未暴露该问题。
- **修复**：测试文件内显式 `afterEach(() => cleanup())`。
- **防复发措施**：新增前端组件测试文件必须显式 cleanup（或将来在 vite.config 加 `test.setupFiles` 统一注册）；断言使用重复 testid 的测试尤其必踩。
- **计划条目名**：`2026-08-31__frontend__rtl-cleanup-globals-false.md`

## 验证证据链（强制）

TDD 红灯证据（每轮实现前实测 FAIL）：

```
$ npx vitest run backend/__tests__/models/productModel.test.js   # W-01 实现前
 Test Files  1 failed (1)
      Tests  5 failed | 5 passed (10)   # 5 条新行为 FAIL；5 条现状不变量本就该 PASS

$ npx vitest run backend/__tests__/controllers/productController.test.js   # W-02 实现前
 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)

$ (frontend) npx vitest run src/api/products.test.js   # W-03 实现前
 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)

$ (frontend) npx vitest run src/screens/ProductListScreen.test.jsx   # W-04 实现前
 Test Files  1 failed (1)
      Tests  5 failed | 1 passed (6)
```

build-test Skill 实测输出：

```
$ npm run test:all
 ✓ backend/__tests__/utils/formatPrice.test.js (2 tests)
 ✓ backend/__tests__/models/productModel.test.js (10 tests)
 ✓ backend/__tests__/controllers/productController.test.js (8 tests)
 ✓ backend/__tests__/middleware/authMiddleware.test.js (5 tests)
 Test Files  4 passed (4)
      Tests  25 passed (25)
 ✓ src/api/products.test.js (5 tests)
 ✓ src/components/Price.test.jsx (2 tests)
 ✓ src/screens/ProductListScreen.test.jsx (6 tests)
 Test Files  3 passed (3)
      Tests  13 passed (13)

$ bash .harness/scripts/backend-smoke.sh
[PASS] 后端启动成功且根路径可访问 (port 61773)   # 退出码 0

$ (cd frontend && npm run build)
✓ 37 modules transformed.
dist/assets/index-DIPio0pw.js  166.24 kB │ gzip: 54.39 kB
✓ built in 287ms

$ node backend/seeder.js
Data imported: products + users   # 退出码 0
```

```
=== 构建与测试报告 ===
单元测试: PASS（38 passed, 0 failed；后端 25 + 前端 13）
后端启动: PASS
前端构建: PASS
种子数据: PASS
总结论:   PASS
```

post-verify Skill 实测输出：

```
$ bash .harness/scripts/verify.sh
[PASS] A1~A8 全部通过（ES Modules / asyncHandler / store 持久化 / 无 console.log
       / ≤300 行 / 路由-Controller 对应 / protect / 无硬编码端口）
[PASS] B1: 前端构建（stamp 命中，跳过重建）
[PASS] B2: seeder.js 语法正确
[PASS] B3: 后端启动冒烟通过
[PASS] B4: E2E 证据审计（未设 VERIFY_TASK，本项跳过）
[PASS] C1~C6 全部通过
[PASS] C7: 架构面改动已同步 codebase-guide
通过: 19 项 · 警告: 0 项 · 失败: 0 项
[PASS] verify.sh 整体通过   # 退出码 0

$ bash .harness/scripts/baseline.sh compare
[PASS] baseline compare: 无新增 FAIL   # 退出码 0
```

```
=== 事后验证报告 ===
通过: 19 项
警告: 0 项
失败: 0 项
总结论: PASS

失败项明细: 无
警告项明细: 无
```

## build-test / post-verify 结果

- build-test：**PASS**（单测 38/38、后端冒烟 PASS、前端构建 PASS、种子 PASS）
- post-verify（verify.sh + baseline compare）：**PASS**（19 PASS / 0 WARN / 0 FAIL；baseline 无新增 FAIL）

## 已知遗留问题

1. 前端 RTL auto-cleanup 因 `globals: false` 全局不生效，当前靠测试文件内显式 `cleanup()` 兜底；建议后续在 vite.config 增加 `test.setupFiles` 统一处理（见回退/踩坑记录草稿）。
2. 切换排序时沿用既有"整页 Loading 替换"路径（design 明确 loading/error 路径不变），期间 sort-select 短暂卸载重挂，浏览器观感有轻微闪烁；不影响 PRD 任何断言，如需优化属后续 UX 任务。
3. E2E 验收（T-E2E-01~05，含真实浏览器下三种排序首件断言、刷新保持、非法地址不白屏）归 test-engineer，Dev 侧未触碰 `e2e/` 目录。

## 结论

PASS
