# 项目概览

> 所有 Agent 必读。token-budget ≤600。只写"项目干什么、怎么跑"。

## 项目简介

Harness Engineering 示例宿主项目：迷你商品目录应用（浏览商品列表 / 搜索 / 详情 / 管理员创建商品 / 邮箱密码登录）。用于承载七角色研发流程的端到端演示，零外部服务依赖（JSON 文件存储替代数据库）。

## 技术栈

- 后端：Node.js + Express（ES Modules），JSON 文件存储（`backend/db/store.js`）
- 前端：React 18 + Vite + react-router-dom
- 认证：HMAC 签名 token（`backend/utils/token.js`），Bearer 头传递
- 测试：Vitest（后端 node 环境 / 前端 jsdom）+ Playwright E2E

## 关键命令

| 命令 | 作用 |
|---|---|
| `npm run server` | 启动后端（端口读 .env 的 PORT，默认 5001） |
| `npm run client` | 启动前端 dev server（3000，/api 代理到后端） |
| `npm run data:import` | 灌种子数据（破坏性重建 backend/data/db.json） |
| `npm run test:all` | 后端 + 前端全部单元/组件测试 |
| `npm run build` | 前端生产构建（frontend/dist/） |
| `npm run test:e2e` | 活跃 E2E 回归集（忽略 e2e/_archived/） |

## Harness 角色索引

| 角色 | 阶段 | 产出 |
|---|---|---|
| PM 项目经理 | 全程 | 调度 / Spec Merge / board |
| BA 业务分析师 | propose | requirements.md |
| SA 方案架构师 | propose | design.md（refactor 档另出 impact-analysis.md） |
| RR 就绪评审员 | propose | readiness-review.md（quick 档跳过） |
| Dev 开发工程师 | apply | 代码 + 单测 + dev-log.md |
| CR 代码审查员 | apply | code-review.md |
| TE 测试工程师 | apply | test-report.md |

> BA 注意：禁止把实现细节写进需求。
