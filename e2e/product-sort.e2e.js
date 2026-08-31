// product-sort 任务承载 spec（B 类功能验收）。文本用例见 e2e/product-sort.cases.md（1:1 对照）。
// 覆盖 PRD-R-005（PRD-S-010~014）、PRD-R-006（PRD-S-015~016）。
import { test, expect } from '@playwright/test';

const EVIDENCE = `.playwright-cli/_tasks/${process.env.VERIFY_TASK ?? 'product-sort'}`;

const LOWEST = 'USB-C Hub 8-in-1'; // $24.99，同时也是最新上架（2026-05-11）
const HIGHEST = 'iPhone 15 Pro 256GB'; // $999.99
const DEFAULT_FIRST = 'Airpods Wireless Bluetooth Headphones'; // 种子默认顺序首件

const items = (page) => page.getByTestId('product-list').locator('li');

// 证据水印：截图前在页面右下角标注用例编号 + 当前地址（仅测试运行时 DOM 注入，不触碰产品代码）。
// 让每张截图自带 URL 上下文，同时避免不同用例的相同视觉状态产生逐字节重复证据。
async function shot(page, caseId, slug) {
  await page.evaluate((id) => {
    const tag = document.createElement('div');
    tag.style.cssText =
      'position:fixed;right:8px;bottom:8px;background:#222;color:#0f0;font:12px monospace;padding:4px 8px;z-index:9999';
    tag.textContent = `${id} @ ${location.href}`;
    document.body.appendChild(tag);
  }, caseId);
  await page.screenshot({ path: `${EVIDENCE}/${caseId}-${slug}.png` });
}

test('B-E2E-01 按价格从低到高排序，首件为全场最低价（PRD-S-010）', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('sort-select').selectOption('price_asc');
  await expect(page).toHaveURL(/sort=price_asc/);
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(LOWEST);
  await expect(items(page).first()).toContainText('$24.99');
  await expect(items(page).last()).toContainText(HIGHEST);
  await shot(page, 'B-E2E-01', 'price-asc');
});

test('B-E2E-02 按价格从高到低排序，首件为全场最高价（PRD-S-011）', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('sort-select').selectOption('price_desc');
  await expect(page).toHaveURL(/sort=price_desc/);
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(HIGHEST);
  await expect(items(page).first()).toContainText('$999.99');
  await expect(items(page).last()).toContainText(LOWEST);
  await shot(page, 'B-E2E-02', 'price-desc');
});

test('B-E2E-03 按最新上架排序，首件为最近上架商品（PRD-S-012）', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('sort-select').selectOption('newest');
  await expect(page).toHaveURL(/sort=newest/);
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(LOWEST); // USB-C Hub createdAt 2026-05-11 最新
  await expect(items(page).last()).toContainText(DEFAULT_FIRST); // Airpods 2026-01-05 最早
  await shot(page, 'B-E2E-03', 'newest');
});

test('B-E2E-04 未选择排序保持默认顺序（PRD-S-013）', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('sort-select')).toHaveValue('');
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(DEFAULT_FIRST);
  await expect(items(page).last()).toContainText(LOWEST); // 种子顺序末件 id=5
  expect(new URL(page.url()).searchParams.has('sort')).toBe(false);
  await shot(page, 'B-E2E-04', 'default-order');
});

test('B-E2E-05 排序与关键词搜索并存，过滤范围不因排序改变（PRD-S-014）', async ({ page }) => {
  await page.goto('/?keyword=on&sort=price_asc'); // keyword=on 匹配 Airpods/iPhone/Monitor 共 3 件
  await expect(items(page)).toHaveCount(3);
  await expect(items(page).first()).toContainText(DEFAULT_FIRST); // $89.99 组内最低
  await expect(items(page).last()).toContainText(HIGHEST); // $999.99 组内最高
  // 切换排序为价格从高到低：keyword 保留、结果集不变、顺序反转
  await page.getByTestId('sort-select').selectOption('price_desc');
  await expect(page).toHaveURL(/keyword=on/);
  await expect(page).toHaveURL(/sort=price_desc/);
  await expect(items(page)).toHaveCount(3);
  await expect(items(page).first()).toContainText(HIGHEST);
  await expect(items(page).last()).toContainText(DEFAULT_FIRST);
  await shot(page, 'B-E2E-05', 'keyword-with-sort');
});

test('B-E2E-06 刷新页面排序保持（PRD-S-015）', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('sort-select').selectOption('price_asc');
  await expect(page).toHaveURL(/sort=price_asc/);
  await expect(items(page).first()).toContainText(LOWEST);
  await page.reload();
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(LOWEST); // 刷新后仍升序
  await expect(page.getByTestId('sort-select')).toHaveValue('price_asc'); // 选择器状态保持
  await expect(page).toHaveURL(/sort=price_asc/);
  await shot(page, 'B-E2E-06', 'reload-persist');
});

test('B-E2E-07 地址中排序值不合法时退化为默认顺序，不报错不白屏（PRD-S-016）', async ({ page }) => {
  await page.goto('/?sort=hacked');
  await expect(page.getByTestId('product-list')).toBeVisible(); // 非白屏
  await expect(items(page)).toHaveCount(5);
  await expect(items(page).first()).toContainText(DEFAULT_FIRST); // 默认顺序
  await expect(page.getByTestId('sort-select')).toHaveValue(''); // 选择器回退默认项
  await expect(page.getByRole('alert')).toHaveCount(0); // 无错误提示
  await shot(page, 'B-E2E-07', 'invalid-sort-fallback');
});
