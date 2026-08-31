# products 域 E2E 文本用例（与 products.e2e.js 的 test() 1:1 对照）

## B-E2E-01 首页展示种子商品列表
- **Given** 种子数据已导入（5 件商品）
- **When** 用户打开首页 `/`
- **Then** 商品列表可见，共 5 项，包含 "iPhone 15 Pro 256GB"

## B-E2E-02 点击商品进入详情页并展示价格
- **Given** 用户位于首页
- **When** 点击 "Mechanical Keyboard 87 Keys"
- **Then** 进入详情页，标题与价格 $59.50 可见

## B-E2E-03 访问不存在的商品显示错误提示不白屏
- **Given** 商品 9999 不存在
- **When** 用户直接访问 `/product/9999`
- **Then** 页面展示 "Product not found" 错误提示，不白屏
