# product-sort — 开发就绪评审（RR 产出）

## 导航头
- R/S 覆盖：PRD-R-005 ~ PRD-R-006；PRD-S-010 ~ PRD-S-016
- 文档状态：Updated

> 本评审为独立裁判产出，怀疑倾向优先。全部关键事实性声明已对照实际代码、种子数据与 specs 逐项核验（见各节"实证"）。每个 ⚠️/❌ 附影响 + 建议处理方式。

## A. 必做检查

### 输入材料清单

| 材料 | 状态 |
|---|---|
| `.harness/deliverables/product-sort/requirements.md` | ✅ 已完稿（导航头 / 功能与非功能需求 / 范围边界 / Spec Delta / 结论 PASS 齐备，无占位符） |
| `.harness/deliverables/product-sort/design.md` | ✅ 已完稿（11 章节齐备：对照表 / 概览 / 总体设计 / 时序 / 模块拆分 / 接口 / 数据 / 兼容回滚降级 / Tasks / 依赖 / 结论，无占位符） |
| `.harness/specs/_index.md` + `specs/products.md` | ✅ 已读（商品域 frontmatter：id_max_r=4 / id_max_s=9 / retired=[]） |
| `.harness/codebase-guide/overview.md`（另核 frontend-arch.md / deps.md 相关约束） | ✅ 已读 |
| profile 核对 | ✅ proposal 选择 standard，RR 作为独立 Task 执行符合契约适用范围；非 refactor 档，无 impact-analysis 交叉核对义务 |

### 需求检查

- **完整性**：⚠️ 有一处形式性偏差，实质覆盖成立。
  - PRD-R-005：SHALL ✅；正向 Scenario ×3（PRD-S-010/011/012）✅；边界 ×2（PRD-S-013/014）；**无显式标注"异常"的 Scenario**。
  - PRD-R-006：SHALL ✅；正向（PRD-S-015）✅；异常（PRD-S-016）✅。
  - 分析：R-005 的输入面（排序选择器）是封闭枚举，访客经选择器无法产生非法输入；本功能唯一的异常向量是"地址中被篡改的排序值"，该向量的载体（页面地址）归属 R-006，异常路径已以 PRD-S-016 完整登记，且非功能-稳定性条款再作了全局兜底。
  - **影响**：若机械执行"每条 R ≥1 异常"的字面标准，R-005 会被判缺项；但异常语义并无真实缺口，补一条 R-005 下的异常 Scenario 只会与 S-016 双写同一行为，反而违反单一登记原则。
  - **建议处理方式**：维持现状，不打回；TE 在验证时将 PRD-S-016 同时视作 R-005 排序能力的异常覆盖（design T-E2E-03 已如此安排）。此判断已记录在案供人工复核。
- **纯净度**：✅ 无违规。全文通读，未出现文件路径、框架/库名、接口路径、HTTP 动词、参数名、Schema、组件名。"页面地址 / 排序方式 / 默认顺序 / 上架（创建）时间"均为业务语言。默认假设、范围边界同样干净。**无硬 BLOCK 事由。**
- **可验证性**：✅ 每条 GWT 的 Then 均可判定（首件为全场最低/最高/最新、地址体现选择、默认顺序、不报错不白屏）。实证：对照种子数据 `backend/data/seed/products.json`（5 件商品），价格最低 = USB-C Hub 8-in-1（$24.99）、最高 = iPhone 15 Pro（$999.99）、createdAt 最新 = USB-C Hub（2026-05-11）、store 原序首件 = Airpods——design 的 T-E2E 断言锚点与种子数据完全吻合，TE 可直接落判据。成功标准 5 条均可逐条判定。
- **Spec Delta**：✅ 可定位、覆盖完整、编号无冲突。实证：products.md 现有 PRD-R-001~004 / PRD-S-001~009，frontmatter id_max_r=4、id_max_s=9、retired 为空；Delta 从 R-005 / S-010 起新增 7 条 ADDED，全部落商品域、无跨文件双写、无 TBD 占位、无 MODIFIED/REMOVED；merge 后 id_max_r=6 / id_max_s=16 推算正确。影响面分析与 _index.md 一致（CSTR-001 只约束写操作，排序为只读，不受影响）。

### 方案检查

- **覆盖性**：✅ "需求 → 技术落实"对照表逐条覆盖 PRD-S-010~016 全部 7 条 Scenario 及 4 条非功能条款；Tasks（W-01~W-05、T-E2E-01~05）均带 R/S 回链，无孤儿 Scenario、无越权新增需求。
- **结构完整性**：✅
  - 错误处理：不合法 sort 双端白名单静默降级（200 + 默认顺序，无 throw 路径）；列表加载失败沿用既有 alert 路径（PRD-S-002 回归时序图在列）。
  - 鉴权：明确无变化，挂公开接口，CSTR-001 不受影响——与 specs 核对属实。
  - 回滚/降级：纯代码 revert，无数据迁移；带 sort 的旧分享地址回滚后自然退化为默认顺序，闭环成立。
  - Testing-only 归属：W（Dev-owned 单测/组件测试）与 T-E2E（test-engineer，含 cases.md 1:1 对照）拆分清晰，与既有 e2e 资产模式（`e2e/products.cases.md` + `products.e2e.js`）一致；无 CSS 断言点的说明合理（原生 select）。
- **关键遗漏**：未发现阻断性遗漏。事实核验（逐项对照实际代码）：
  - `backend/models/productModel.js` 现状 `find` 仅 keyword 过滤 ✅（design 的"先过滤后排序同层收敛"改法与现状吻合）；`backend/controllers/productController.js` 为 asyncHandler 薄透传 ✅；
  - `frontend/src/api/products.js` 现状 `listProducts()` 无参 ✅；`ProductListScreen.jsx` 现状 `useEffect` 依赖空数组 ✅（design 已在"已知风险"如实登记该改动点）；
  - 副本排序（`[...rows].sort`）约束正确——`store.read` 返回数组若被原地 sort 会污染默认顺序，design 已显式禁止并回链 PRD-S-013 ✅；
  - 架构符合性：`useSearchParams` 不引全局状态（frontend-arch"引入全局状态前先论证"约束）✅；API 仍走 `apiGet` 统一封装（verify C4）✅；无新依赖，`react-router-dom@^6.26` 与 frontend/package.json、deps.md 登记一致 ✅。
  - BA 交接给 RR 的两项专项：①design 未引入 proposal 排除项（无组合排序、无分页、无销量/评分排序）✅；②"默认顺序"未被设计改变（sort 缺省分支零改动 + 副本排序）✅。
  - ⚠️ 一处测试落点错位（不阻断，见下）：W-02 将"三种排序正确 / keyword+sort 先过滤后排序"的断言安排在 `backend/__tests__/controllers/productController.test.js` 扩充，但该测试文件现有模式**将 `Product.find` 整体 mock 掉**——mock 之下 controller 测试只能断言"sort 参数被透传"，无法断言排序语义本身；而承载排序语义的 W-01（Model 层）未配任何直接单测文件。
    - **影响**：若 Dev 机械沿用现有 mock 模式，排序核心逻辑在单测层面会出现零覆盖，仅剩 E2E 兜底，缺陷发现将后移至 TE 阶段。
    - **建议处理方式**：无需打回（任务边界与职责拆分本身正确，属实现落点提示）。人工放行时向 Dev 明确：W-01/W-02 落地时须为 Model 排序逻辑建立不 mock 的直接断言（新增 model 层测试文件或在现有测试中局部绕开 mock 均可），使"三正向 + 缺省 + 非法值 + keyword 组合"在单测层真实执行。

### 前置条件检查

- **环境**：✅ 无新增。dev/test 命令齐备（`npm run server/client/test:all/test:e2e`），Playwright webServer 机制现成。
- **数据**：✅ 排序依据 `price` 与 `createdAt` 在种子数据 5 件商品上全部具备且值可比较（已逐件核验）；无迁移、无需改 db.json 结构；`npm run data:import` 现成。
- **权限**：✅ 只读公开能力，无新增鉴权面。
- **配置**：✅ 无新增配置项 / 环境变量 / 开关。
- **外部依赖**：✅ 零新增 npm 依赖；`useSearchParams`、vitest、@testing-library/react、@playwright/test 均已在 package.json 与 deps.md 登记（已核对版本）。

## B. 可选检查（触发条件命中则必须写）

- **B1 安全/稳定/可测/可运维**：未命中硬触发条件（无认证授权变化、无写操作、无并发面）。就稳定性条款补充一点核验结论：非法输入路径为双端白名单（后端忽略 + 前端选择器回退），"降级路径即缺省路径"，无独立开关、无运维介入点，稳定性设计充分。
- **B2 落地可行性与拆分建议**：未触发。改动面小（前后端各 2 文件 + 测试资产），W-01~W-05 粒度合适，无需再拆。
- **B3 高概率疑问点与隐含假设**（触发：口径存在易误读点，必写）：
  1. **"访客已按关键词过滤商品列表"的前置如何达成**：实证——`frontend/src` 与 `e2e/` 中现状**零处出现 keyword**，即前端目前没有任何关键词搜索入口，关键词过滤是纯接口层能力（specs PRD-S-003 的措辞也是"以关键词请求商品列表"）。PRD-S-014 的 Given 在 UI 层只能通过直接构造页面地址达成（design T-E2E-04 正是 `page.goto('/?keyword=iphone&sort=price_asc')`）。
     **影响**：其一，若验收方期待"页面上有搜索框"则会误判该场景不可测；其二，design W-04 令前端开始读取并透传地址中的 keyword，这使 `/?keyword=x` 这一**不带排序**的地址形态行为发生变化（现状被前端忽略 → 改后生效过滤），与非功能-兼容性"未携带排序选择的既有页面地址行为不变"字面上存在张力——尽管该地址形态从未由现有 UI 产生、且过滤语义正是 specs PRD-R-002 已登记的既有能力，实为补齐而非破坏。
     **建议处理方式**：人工放行时确认此口径（"URL keyword 透传视为兑现既有规约，不视为兼容性破坏"）；TE 按 design 既定方式用直接地址构造前置，不要求 UI 搜索框。若人工不接受此口径，则打回 SA 收窄 W-04（仅透传 sort，不透传 keyword），届时 PRD-S-014 只能在接口层验证。
  2. **R-005 异常 Scenario 落位**：见 A 节"完整性"⚠️，异常向量整体登记于 R-006（PRD-S-016），非缺口，验证时合并视作 R-005 的异常覆盖。
  3. **同值商品顺序**：requirements 默认假设已声明"相对先后不作要求"，design 亦声明"同值稳定性不作断言"，两端口径一致，TE 不得对同价/同时刻商品的相对顺序设卡。

## 结论

PASS

- A 节四组检查全部满足：需求完整（R-005 异常落位偏差经论证无实质缺口）、纯净度零违规（无硬 BLOCK 事由）、全部 Scenario 可验证且断言锚点与种子数据实证吻合、Spec Delta 编号与商品域现有全局码（id_max_r=4 / id_max_s=9）无冲突且推算正确；方案对 7 条 Scenario 与非功能条款全覆盖，错误处理/鉴权/回滚降级/测试归属齐备，与 codebase-guide 架构模式一致，未引入 proposal 排除项；前置条件（环境/数据/权限/配置/依赖）全部就绪。
- 三处 ⚠️ 均已给出影响与处理方式，不构成阻塞：①R-005 异常 Scenario 由 PRD-S-016 承载（口径合并）；②URL keyword 透传的兼容性口径需人工放行时确认；③排序语义单测不得被现有 controller mock 模式架空，需 Dev 落地时对 Model 层建立直接断言。
- 提醒：本 PASS 不等于自动放行，须由人显式执行 `/harness-apply` 后方可进入开发。

## 人工确认

- [ ] 已确认（人工审批 1：审阅后执行 /harness-apply）——请重点复核 B3-1 的 keyword 透传口径与 A 节测试落点提示
