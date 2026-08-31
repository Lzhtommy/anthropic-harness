---
name: test-e2e
description: E2E 验收 SOP（TE 专用）。Playwright 真实浏览器执行 B 类功能验收：环境准备 → 写 cases/spec → 正式执行 → 截图留证 → 文本/脚本对照 → 汇总 → 证据自检。
---

# test-e2e — B 类功能验收 SOP（Playwright）

## 执行范围（先定范围再跑）

- B 类默认只跑当前任务承载 spec：`npx playwright test e2e/<TASK_NAME>.e2e.js`
- C 类回归最多选择性跑 1-2 个相关历史 spec（如 `npx playwright test e2e/products.e2e.js`）
- 全量 `npm run test:e2e` 是人工回归入口，**不是** TE 默认命令；归档集在 `e2e/_archived/`

## Step 1 环境准备

```bash
bash .harness/scripts/ensure-playwright.sh   # 浏览器按需安装（缓存命中 ~40ms）
npm run data:import                           # 灌种子，保证数据前置一致
```
前后端由 playwright.config.js 的 webServer 自动拉起（后端 5001 / 前端 3000），无需手动启动；若需手工探索再自行 `npm run server` / `npm run client`。

## Step 2 设计用例并落文本

从 requirements.md 的每条 Scenario（GWT）+ design.md 的 Testing-only 口径推导 B 类用例，写入 `e2e/<TASK_NAME>.cases.md`：每条含编号（B-E2E-xx）+ Given/When/Then 文本。
最低门槛：每条正向 S-xxx ≥1、每条异常/边界 S-xxx ≥1，合计 ≥6。

## Step 3 写 Playwright spec

`e2e/<TASK_NAME>.e2e.js`：每条 cases.md 文本用例对应**一条** `test()`（1:1），断言 + 截图：

```js
import { test, expect } from '@playwright/test';

const EVIDENCE = `.playwright-cli/_tasks/${process.env.VERIFY_TASK ?? '<TASK_NAME>'}`;

test('B-E2E-01 <场景一句话>', async ({ page }) => {
  await page.goto('/');                        // Given/When 操作序列
  await expect(page.getByTestId('...')).toBeVisible();   // Then 断言
  await page.screenshot({ path: `${EVIDENCE}/B-E2E-01-<slug>.png` });
});
```

## Step 4 正式执行

```bash
mkdir -p .playwright-cli/_tasks/<TASK_NAME>
npx playwright test e2e/<TASK_NAME>.e2e.js
```

## Step 5 文本 ↔ 脚本对照（必做）

在 test-report.md 填「E2E 文本用例 ↔ Playwright 对照表」：编号 / GWT 摘要 / test() 名 / 证据文件 / 判定。条数必须与 spec 中 test() 一致。

## Step 6 汇总报告

回填 test-report.md 的 B-1/B-2 表格与统计汇总。

## Step 7 退出前证据自检

```bash
python3 .harness/scripts/check-e2e-evidence.py runtime <TASK_NAME> --require-refs
```

## 七条红线

1. 每条用例必须真实浏览器执行（`npx playwright test`），不是 jsdom
2. 失败必须截图（Playwright 已配 only-on-failure，失败截图路径写进失败项详情）
3. 不得跳过承载 spec
4. 不要自己修实现 bug——记录标 FAIL；实现 bug 路由 Dev、环境交 PM、上游口径升级给人
5. 定位器从页面实际结构获取（getByTestId/getByRole），不硬编码猜测
6. 证据落 `.playwright-cli/_tasks/<TASK_NAME>/`，命名 `B-E2E-<编号>-<slug>.png`（禁纯时间戳、禁根目录、报告内相对路径）
7. 环境起不来 → 结论 FAIL（环境阻塞），禁止"PASS（E2E 未跑）"
