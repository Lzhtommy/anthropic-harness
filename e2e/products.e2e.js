// 商品域基线回归 spec（活跃回归集）。文本用例见 e2e/products.cases.md（1:1 对照）。
import { test, expect } from '@playwright/test';

test('首页展示种子商品列表', async ({ page }) => {
  await page.goto('/');
  const list = page.getByTestId('product-list');
  await expect(list).toBeVisible();
  await expect(list.locator('li')).toHaveCount(5);
  await expect(page.getByText('iPhone 15 Pro 256GB')).toBeVisible();
});

test('点击商品进入详情页并展示价格', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Mechanical Keyboard 87 Keys').click();
  await expect(page.getByRole('heading', { name: 'Mechanical Keyboard 87 Keys' })).toBeVisible();
  await expect(page.getByText('$59.50')).toBeVisible();
});

test('访问不存在的商品显示错误提示不白屏', async ({ page }) => {
  await page.goto('/product/9999');
  await expect(page.getByRole('alert')).toContainText('Product not found');
});
