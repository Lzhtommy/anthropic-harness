# 客户端架构

> React 客户端路由、API 层与组件。SA、Dev、CR 必读。

## 路由与页面

路由树注册于 `frontend/src/main.jsx`（verify C2 检查 Screen 必须在此注册）：

| 路径 | Screen |
|---|---|
| `/` | `screens/ProductListScreen.jsx`（商品列表，`data-testid="product-list"`） |
| `/product/:id` | `screens/ProductDetailScreen.jsx`（详情；错误时渲染 `role="alert"` 提示） |

## 状态管理

无全局状态库；页面局部 useState/useEffect。引入全局状态前先在 design.md 论证。

## API 层

- `frontend/src/api/client.js`：唯一 fetch 封装 `apiGet(path)`（非 2xx 抛 Error(message)）。**组件内禁止裸 fetch（verify C4）、禁止 axios（verify C6）**
- `frontend/src/api/products.js`：`listProducts()` → GET /api/products；`getProduct(id)` → GET /api/products/:id
- dev server 通过 vite.config.js 把 `/api` 代理到后端（端口读 env PORT，默认 5001）

## 组件库

- `components/Price.jsx`：金额展示（$xx.xx，非法值退化 $0.00）；组件测试 `Price.test.jsx`（jsdom + @testing-library/react）

## URL 契约

- 商品列表关键词过滤：后端支持 `GET /api/products?keyword=<kw>`（前端界面暂未暴露搜索框）
