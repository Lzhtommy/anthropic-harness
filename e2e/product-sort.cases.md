# product-sort E2E 文本用例（与 product-sort.e2e.js 的 test() 1:1 对照）

覆盖：PRD-R-005（PRD-S-010~014）、PRD-R-006（PRD-S-015~016）。种子数据 5 件商品（`npm run data:import`）：
最低价 USB-C Hub 8-in-1（$24.99）、最高价 iPhone 15 Pro 256GB（$999.99）、最新上架 USB-C Hub 8-in-1（createdAt 2026-05-11）、默认顺序首件 Airpods Wireless Bluetooth Headphones。

## B-E2E-01 按价格从低到高排序（PRD-S-010，正向）
- **Given** 种子数据已导入（5 件价格互不相同的商品），访客位于首页 `/`
- **When** 访客在排序选择器选择"价格从低到高"
- **Then** 列表立即重排为 5 件按价格升序，首件为全场最低价 "USB-C Hub 8-in-1"（$24.99），末件为最高价 "iPhone 15 Pro 256GB"

## B-E2E-02 按价格从高到低排序（PRD-S-011，正向）
- **Given** 种子数据已导入，访客位于首页 `/`
- **When** 访客在排序选择器选择"价格从高到低"
- **Then** 列表立即重排为 5 件按价格降序，首件为全场最高价 "iPhone 15 Pro 256GB"（$999.99），末件为最低价 "USB-C Hub 8-in-1"

## B-E2E-03 按最新上架排序（PRD-S-012，正向）
- **Given** 种子数据已导入（5 件上架时间互不相同），访客位于首页 `/`
- **When** 访客在排序选择器选择"最新上架"
- **Then** 列表立即重排为按上架时间从新到旧，首件为最近上架的 "USB-C Hub 8-in-1"（2026-05-11），末件为最早上架的 "Airpods Wireless Bluetooth Headphones"

## B-E2E-04 未选择排序保持默认顺序（PRD-S-013，边界）
- **Given** 访客打开首页 `/` 且未选择任何排序方式（地址不含 `sort` 参数）
- **When** 商品列表展示
- **Then** 排序选择器显示"默认排序"，列表按上线前默认顺序展示 5 件商品：首件 "Airpods Wireless Bluetooth Headphones"、末件 "USB-C Hub 8-in-1"

## B-E2E-05 排序与关键词搜索并存（PRD-S-014，边界）
- **Given** 访客通过 `/?keyword=on&sort=price_asc` 打开首页（关键词 "on" 过滤结果为 3 件商品，多于一件）
- **When** 商品列表展示，随后访客将排序切换为"价格从高到低"
- **Then** 列表始终仅含 3 件匹配商品（过滤范围不因排序改变）：升序时首件 Airpods（$89.99）；切换后地址仍含 `keyword=on`、结果集不变且顺序反转，首件 iPhone 15 Pro 256GB（$999.99）

## B-E2E-06 刷新页面排序保持（PRD-S-015，正向）
- **Given** 访客已在首页选择"价格从低到高"，页面地址含 `sort=price_asc`
- **When** 访客刷新页面（page.reload）
- **Then** 列表仍按价格升序（首件 "USB-C Hub 8-in-1"），排序选择器仍选中"价格从低到高"（value=price_asc），地址仍含 `sort=price_asc`

## B-E2E-07 地址中排序值不合法时退化为默认顺序（PRD-S-016，异常）
- **Given** 访客通过被篡改地址 `/?sort=hacked` 直接打开首页
- **When** 商品列表展示
- **Then** 列表按默认顺序正常展示 5 件商品（首件 Airpods），排序选择器回退"默认排序"，页面无 role="alert" 错误提示、不白屏
