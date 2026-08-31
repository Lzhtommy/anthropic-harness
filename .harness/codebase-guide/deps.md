# 外部依赖地图

> 每个依赖为什么存在、在哪使用。SA、Dev、CR 必读；引入新依赖必须在此登记，否则 CR REJECT。

## 后端依赖（根 package.json · dependencies）

| 依赖 | 版本 | 用途 | 关键使用点 |
|---|---|---|---|
| express | ^4.19 | HTTP 框架 | backend/app.js、routes/* |

## 根 devDependencies

| 依赖 | 版本 | 用途 | 关键使用点 |
|---|---|---|---|
| vitest | ^2.1 | 后端单测 | backend/__tests__/**，根 vitest.config.js |
| @playwright/test | ^1.47 | E2E | e2e/*.e2e.js，playwright.config.js（webServer 自动起前后端） |

## 前端依赖（frontend/package.json）

| 依赖 | 版本 | 用途 | 关键使用点 |
|---|---|---|---|
| react / react-dom | ^18.3 | UI | src/** |
| react-router-dom | ^6.26 | 路由 | src/main.jsx、screens/* |
| vite / @vitejs/plugin-react | ^5.4 / ^4.3 | 构建与 dev server | vite.config.js |
| vitest + jsdom + @testing-library/react | ^2.1 | 组件测试 | src/**/*.test.jsx |

## 依赖使用纪律（与 verify.sh 对齐）

- 禁止 frontend/src/**（api/ 之外）直接 fetch（C4 FAIL）；禁止引入 axios（C6 WARN）
- 禁止 backend/** 用 CommonJS require（A1 FAIL）
- 禁止硬编码端口（A8 FAIL，唯一白名单 backend/config.js）
- 新增依赖必须登记本文件，否则 CR REJECT
- 零数据库依赖是本示例项目的有意约束：持久化只走 backend/db/store.js
