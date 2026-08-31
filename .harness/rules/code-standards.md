# 编码规范（code-standards）

> 作用域：`backend/**` 与 `frontend/**` 的代码改动。Developer 必读；CR 逐条对照；verify.sh A/C 类硬校验兜底。

## 后端

1. 使用 ES Modules，**禁止** `require()` / `module.exports`（verify A1）
2. 新增路由放 `backend/routes/` 独立文件，并在 `backend/app.js` 用 `app.use()` 挂载（verify C1）
3. 业务逻辑走 Controller 模式：routes → controllers → models（verify A6）
4. 所有 Controller 导出**必须**用 `asyncHandler` 包裹（verify A2）
5. 需登录路由挂 `protect` 中间件，管理员能力额外挂 `admin`（verify A7）
6. Model 层统一经由 `backend/db/store.js` 持久化，**禁止**在 models/ 直接 `import fs`（verify A3）；Model 必须 `export default`（verify C3）
7. 返回合适的 HTTP 状态码，禁止全返 200
8. 禁止硬编码端口/地址——端口只允许出现在 `backend/config.js`（verify A8）

## 前端

1. API 调用统一经 `frontend/src/api/` 薄封装，组件/页面内**禁止**裸 `fetch`（verify C4）、禁止引入 axios（verify C6）
2. 新页面（Screen）必须在 `frontend/src/main.jsx` 路由树注册（verify C2）
3. 公共展示逻辑抽组件（如 `Price`），组件测试与组件同目录 `*.test.jsx`

## 通用

1. 禁止残留 `console.log`（server.js / seeder.js 除外，verify A4）
2. 单文件 SHOULD ≤300 行（verify A5）
3. 改动数据结构（Model 字段）必须同步种子数据（backend/data/seed/）
4. 架构面改动必须同批修订 `.harness/codebase-guide/` 受影响文档（verify C7）；引入新 npm 依赖必须登记 `codebase-guide/deps.md`，否则 CR REJECT

## 自检步骤（写完一个 API 路由后）

- 输入经过校验？错误路径返回正确状态码？
- 配套单元测试覆盖正向 + 异常？
- 路由已在 app.js 挂载？需要登录的挂了 protect？
