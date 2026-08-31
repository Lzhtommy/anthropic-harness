# 客户端架构

> React 客户端路由、API 层与组件。SA、Dev、CR 必读。

## 路由与页面

路由树注册于 `frontend/src/main.jsx`（verify C2 检查 Screen 必须在此注册）：

| 路径 | Screen |
|---|---|
| `/` | `screens/ProductListScreen.jsx`（商品列表，`data-testid="product-list"`；排序选择器 `data-testid="sort-select"`，以 `useSearchParams` 读写 `?sort=`、保留 `keyword`） |
| `/product/:id` | `screens/ProductDetailScreen.jsx`（详情；错误时渲染 `role="alert"` 提示） |

## 状态管理

无全局状态库；页面局部 useState/useEffect。引入全局状态前先在 design.md 论证。

## API 层

- `frontend/src/api/client.js`：唯一 fetch 封装 `apiGet(path)`（非 2xx 抛 Error(message)）。**组件内禁止裸 fetch（verify C4）、禁止 axios（verify C6）**
- `frontend/src/api/products.js`：`listProducts({keyword?, sort?})` → GET /api/products（URLSearchParams 拼查询串，空值不拼，无参等价现状）；`getProduct(id)` → GET /api/products/:id
- dev server 通过 vite.config.js 把 `/api` 代理到后端（端口读 env PORT，默认 5001）

## 组件库

- `components/Price.jsx`：金额展示（$xx.xx，非法值退化 $0.00）；组件测试 `Price.test.jsx`（jsdom + @testing-library/react）

## URL 契约

- 商品列表关键词过滤：后端支持 `GET /api/products?keyword=<kw>`（前端界面暂未暴露搜索框；ProductListScreen 会读取地址中的 `keyword` 并透传，兑现既有规约 PRD-R-002）
- 商品列表排序（页面地址即排序状态唯一持久化载体，PRD-R-006）：
  - `/` → 默认顺序，选择器显示"默认排序"
  - `/?sort=price_asc|price_desc|newest` → 对应排序，选择器同步选中
  - `/?sort=<非法值>` → 默认顺序展示，选择器回退"默认排序"，无错误 UI（后端白名单静默降级）
  - `/?keyword=x&sort=...` → 先过滤后排序；切换排序保留 `keyword`，选"默认排序"删除 `sort` 键
