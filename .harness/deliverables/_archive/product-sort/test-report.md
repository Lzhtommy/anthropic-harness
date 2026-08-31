# product-sort — 测试报告（TE 产出）

## 导航头
- R/S 覆盖：PRD-R-005 ~ PRD-R-006；PRD-S-010 ~ PRD-S-016
- 文档状态：Updated

> 前置依据：readiness-review.md 结论 PASS；code-review.md 结论 PASS（0 Critical / 0 Major / 3 Minor 备案）。
> 环境：chromium（Playwright，真实浏览器）；种子经 `npm run data:import` 导入（5 件商品）；前后端由 playwright.config.js webServer 自动拉起（后端 5001 / 前端 3000）。
> code-review「给 TE 的关注点」落实情况：T-E2E-01~05 全部落为 B/C 类用例（对应 B-E2E-01/02/03、B-E2E-06、B-E2E-07、B-E2E-05、B-E2E-04 + C 类回归 products.e2e.js）。

## A. API 测试

后端以 `node backend/server.js`（PORT=5001，.env）后台拉起，curl 真打 HTTP，测毕即回收。接口：`GET /api/products?keyword=&sort=`（公开，无鉴权面，无 A-2 权限用例需求——requirements 明确排序对所有访客开放）。

### A-1 功能正确性 + A-3 数据校验

| 编号 | 场景 | 前置 | 预期 | 实际 | 判定 |
|---|---|---|---|---|---|
| A-01 | 无 `sort` 默认顺序 | 种子 5 件 | 200；顺序=种子原序（1,2,3,4,5），首件 Airpods | 200；`1(89.99)→2(999.99)→3(59.5)→4(329)→5(24.99)`，首件 Airpods | ✅ |
| A-02 | `sort=price_asc` | 同上 | 200；价格升序，首件全场最低 USB-C Hub $24.99 | 200；`5(24.99)→3(59.5)→1(89.99)→4(329)→2(999.99)` | ✅ |
| A-03 | `sort=price_desc` | 同上 | 200；价格降序，首件全场最高 iPhone $999.99 | 200；`2(999.99)→4(329)→1(89.99)→3(59.5)→5(24.99)` | ✅ |
| A-04 | `sort=newest` | 同上 | 200；createdAt 从新到旧，首件 USB-C Hub（2026-05-11） | 200；`5→4→3→2→1`，首件 USB-C Hub、末件 Airpods | ✅ |
| A-05 | `sort=hacked`（非法值） | 同上 | 200（绝非 400）+ 默认顺序，无错误体 | 200；顺序与 A-01 逐项一致 | ✅ |
| A-06 | `keyword=on&sort=price_asc`（先过滤后排序） | 同上 | 200；仅 3 件匹配（Airpods/Monitor/iPhone），组内升序 | 200；`1(89.99)→4(329)→2(999.99)`，共 3 件 | ✅ |
| A-07 | `sort=__proto__`（原型链键注入） | 同上 | 200 + 默认顺序，不抛错 | 200；顺序与 A-01 一致 | ✅ |
| A-08 | `sort=a&sort=b`（数组型 query） | 同上 | 200 + 默认顺序（非字符串安全忽略） | 200；顺序与 A-01 一致 | ✅ |

A 类小计：8/8 通过。响应结构 `{ products: [...] }` 全程不变（兼容性条款实证）。

## B. 功能验收测试（Given-When-Then）

执行方式：`npx playwright test e2e/product-sort.e2e.js`（真实 chromium，7 tests / 7 passed，2.2s）。文本用例：`e2e/product-sort.cases.md`（1:1）。keyword 组合场景按 PRD-S-014 的 Given（"过滤结果多于一件商品"）采用 `keyword=on`（匹配 3 件），替代 design T-E2E-04 示例中仅匹配 1 件的 `keyword=iphone`，使"结果集不变 + 顺序反转"断言真实可判。

### B-1 页面与交互（正向）

| 编号 | R | S | Given | When | Then | 实际 | 判定 |
|---|---|---|---|---|---|---|---|
| B-E2E-01 | PRD-R-005 | PRD-S-010 | 种子 5 件，访客位于 `/` | 选择器选"价格从低到高" | URL 含 `sort=price_asc`；5 件升序，首件 USB-C Hub $24.99、末件 iPhone | 断言全过 | ✅ |
| B-E2E-02 | PRD-R-005 | PRD-S-011 | 同上 | 选"价格从高到低" | URL 含 `sort=price_desc`；首件 iPhone $999.99、末件 USB-C Hub | 断言全过 | ✅ |
| B-E2E-03 | PRD-R-005 | PRD-S-012 | 种子上架时间互不相同 | 选"最新上架" | URL 含 `sort=newest`；首件 USB-C Hub（2026-05-11 最新）、末件 Airpods（最早） | 断言全过 | ✅ |
| B-E2E-06 | PRD-R-006 | PRD-S-015 | 已选"价格从低到高"，地址含 `sort=price_asc` | `page.reload()` | 刷新后仍升序（首件 USB-C Hub），选择器仍选中 `price_asc`，地址保持 | 断言全过 | ✅ |

### B-2 边界与异常

| 编号 | R | S | Given | When | Then | 实际 | 判定 |
|---|---|---|---|---|---|---|---|
| B-E2E-04 | PRD-R-005 | PRD-S-013（边界） | 打开 `/`，未选任何排序 | 列表展示 | 选择器显示"默认排序"；5 件按上线前默认顺序（首件 Airpods、末件 USB-C Hub）；URL 无 `sort` 键 | 断言全过 | ✅ |
| B-E2E-05 | PRD-R-005 | PRD-S-014（边界） | `/?keyword=on&sort=price_asc`（过滤结果 3 件 > 1 件） | 展示后切换为"价格从高到低" | 全程仅 3 件（过滤范围不变）；切换后地址仍含 `keyword=on`、顺序反转（首件 iPhone） | 断言全过 | ✅ |
| B-E2E-07 | PRD-R-006 | PRD-S-016（异常） | 篡改地址 `/?sort=hacked` 直接打开 | 列表展示 | 列表可见（非白屏）、5 件默认顺序（首件 Airpods）、选择器回退"默认排序"、无 `role="alert"` | 断言全过 | ✅ |

正向 S（010/011/012/015）各 1 条 + 边界/异常 S（013/014/016）各 1 条，合计 7 条 ≥ 6，7 条 Scenario 全覆盖。

### E2E 文本用例 ↔ Playwright 对照表

| 编号 | GWT 摘要 | Playwright test() | 证据 | 判定 |
|---|---|---|---|---|
| B-E2E-01 | 选价格升序→首件全场最低价 | `B-E2E-01 按价格从低到高排序，首件为全场最低价（PRD-S-010）` | evidence/B-E2E-01-price-asc.png | ✅ |
| B-E2E-02 | 选价格降序→首件全场最高价 | `B-E2E-02 按价格从高到低排序，首件为全场最高价（PRD-S-011）` | evidence/B-E2E-02-price-desc.png | ✅ |
| B-E2E-03 | 选最新上架→首件最近上架 | `B-E2E-03 按最新上架排序，首件为最近上架商品（PRD-S-012）` | evidence/B-E2E-03-newest.png | ✅ |
| B-E2E-04 | 未选排序→默认顺序 | `B-E2E-04 未选择排序保持默认顺序（PRD-S-013）` | evidence/B-E2E-04-default-order.png | ✅ |
| B-E2E-05 | keyword+sort 并存、切排序保留 keyword | `B-E2E-05 排序与关键词搜索并存，过滤范围不因排序改变（PRD-S-014）` | evidence/B-E2E-05-keyword-with-sort.png | ✅ |
| B-E2E-06 | 刷新后排序与选择器保持 | `B-E2E-06 刷新页面排序保持（PRD-S-015）` | evidence/B-E2E-06-reload-persist.png | ✅ |
| B-E2E-07 | 非法 sort 地址退化默认、不白屏 | `B-E2E-07 地址中排序值不合法时退化为默认顺序，不报错不白屏（PRD-S-016）` | evidence/B-E2E-07-invalid-sort-fallback.png | ✅ |

7 行 = spec 内 7 条 test()，1:1 一致。截图右下角水印为测试运行时 DOM 注入的用例编号 + 当前地址（Testing-only，不触碰产品代码）。

## C. 回归测试

- **API 探测**：A-01（无参默认顺序逐项等于种子原序）+ A-06（keyword 过滤行为不变）即兼容性回归探测，均 ✅。
- **历史 spec**：`npx playwright test e2e/products.e2e.js`（design 兼容性条款点名"无需修改即应保持全绿"）：

| 编号 | 场景（对应既有 PRD-S） | 实际 | 判定 |
|---|---|---|---|
| C-01 | 首页展示种子商品列表（5 件，含 iPhone） | passed (126ms) | ✅ |
| C-02 | 点击商品进入详情页并展示价格 $59.50 | passed (160ms) | ✅ |
| C-03 | 访问不存在商品显示 "Product not found" 不白屏（PRD-S-002 错误提示路径） | passed (95ms) | ✅ |

结果：`3 passed (1.5s)`，spec 零修改全绿。商品详情跳转、关键词搜索、列表加载失败提示均未被破坏。

## D. 工程验证

### build-test（SOP 五步）

Step 1 `npm run test:all`：后端 `Test Files 4 passed (4) / Tests 25 passed (25)`；前端 `Test Files 3 passed (3) / Tests 13 passed (13)`。合计 38 passed / 0 failed。
Step 2 `bash .harness/scripts/backend-smoke.sh`：`[PASS] 后端启动成功且根路径可访问 (port 64177)`。
Step 3 前端构建：`✅ 前端构建成功（stamp 命中，跳过重建）`。
Step 4 `node backend/seeder.js`：`Data imported: products + users`（退出码 0）。

```
=== 构建与测试报告 ===
单元测试: PASS（38 passed, 0 failed）
后端启动: PASS
前端构建: PASS
种子数据: PASS
总结论:   PASS
```

### post-verify

`LC_ALL=C VERIFY_TASK=product-sort bash .harness/scripts/verify.sh` 实际输出（尾部汇总原样转录）：

```
=== verify.sh — A 类静态规范 ===
[PASS] A1 ~ A8（8 项全过）
=== verify.sh — B 类交付门槛 ===
[PASS] B1: 前端构建（stamp 命中，跳过重建）
[PASS] B2: seeder.js 语法正确
[PASS] B3: 后端启动冒烟通过
[PASS] B4: E2E 证据审计通过（task=product-sort）
=== verify.sh — C 类工程一致性 ===
[PASS] C1 ~ C7（7 项全过，含 C7 codebase-guide 同步）
=== verify.sh 汇总 ===
通过: 19 项 · 警告: 0 项 · 失败: 0 项
[PASS] verify.sh 整体通过
```

```
=== 事后验证报告 ===
通过: 19 项
警告: 0 项
失败: 0 项
总结论: PASS
```

`bash .harness/scripts/baseline.sh compare` → `[PASS] baseline compare: 无新增 FAIL`（退出码 0）。

证据审计单独复核：`python3 .harness/scripts/check-e2e-evidence.py audit product-sort --duplicates-as-warn` → `[PASS] E2E 证据引用闭环（引用 7 项 / 实物 7 项）`，无重复证据 WARN。

环境备注（非本任务代码问题，路由 PM 知悉）：macOS 系统 bash 3.2 在 UTF-8 locale 下会把 verify.sh 第 119 行 `$VERIFY_TASK` 后紧邻的全角"）"误并入变量名，报 `unbound variable`（bash 3.2 多字节解析缺陷，仅在设置 VERIFY_TASK 时触发）。以 `LC_ALL=C` 按字节解析执行即通过，19 检查点结果不受影响；建议后续基建任务将该行改为 `${VERIFY_TASK}` 花括号写法根治（TE 无权修改 .harness 脚本，仅备案）。

## 统计汇总

| 类别 | 用例数 | 通过 | 失败 | 通过率 |
|---|---|---|---|---|
| A. API | 8 | 8 | 0 | 100% |
| B. 功能验收（真实浏览器） | 7 | 7 | 0 | 100% |
| C. 回归 | 3（+2 项 API 探测计入 A） | 3 | 0 | 100% |
| D. 工程验证 | 6（build-test 4 步 + verify.sh + baseline） | 6 | 0 | 100% |
| 合计 | 24 | 24 | 0 | 100% |

成功标准复核：① 三种排序首件断言（B-E2E-01/02/03 + A-02/03/04）✅ ② 地址随选择变化且刷新/新开保持（B-E2E-01/05/06）✅ ③ 非法值默认展示无错误无白屏（B-E2E-07 + A-05/07/08）✅ ④ 默认顺序与上线前一致 + 既有能力回归（B-E2E-04 + A-01 + C 类）✅ ⑤ PRD-S-010~016 逐条判定通过（7/7）✅。

## 失败项详情（有 FAIL 时必填）

无失败项。

备注（非缺陷）：B-E2E-05 采用 `keyword=on`（3 件）而非 design T-E2E-04 示例的 `keyword=iphone`（仅 1 件），以满足 PRD-S-014 Given"过滤结果多于一件商品"并使顺序断言可判定；Scenario 语义完全一致。

## 结论

PASS
