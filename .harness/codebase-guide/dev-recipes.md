# 常见开发场景

> Dev 必读。每个 recipe 三段：涉及文件 + 同步点 + 跨层一致性检查。

## 新增 API + 页面（全链）

- **涉及文件**：`backend/models/<x>Model.js`（经 store）→ `backend/__tests__/controllers/<x>Controller.test.js`（先写，FAIL）→ `backend/controllers/<x>Controller.js`（asyncHandler 包裹）→ `backend/routes/<x>Routes.js` → `backend/app.js` 挂载 → `frontend/src/api/<x>.js` → `frontend/src/screens/<X>Screen.jsx` → `frontend/src/main.jsx` 注册路由
- **同步点**：新 Model 字段 → `backend/data/seed/*.json`；新路由/Controller/Model → `codebase-guide/backend-arch.md`；新 Screen/api → `frontend-arch.md`；新依赖 → `deps.md`
- **跨层一致性**：verify.sh A2/A6/C1/C2/C4/C7 全部会扫到——写完先本地跑 `bash .harness/scripts/verify.sh`

## 给现有模型加字段

- **涉及文件**：`backend/models/<x>Model.js`（create 默认值）、`backend/data/seed/<x>.json`（每条种子补字段）、相关 controller 校验、前端展示组件
- **同步点**：backend-arch.md 数据模型段；老数据兼容语义写进 design.md 的「兼容性」
- **跨层一致性**：重跑 `npm run data:import` 后 `npm run test:all`

## 加认证保护

- **涉及文件**：路由文件引入 `protect`（管理员再加 `admin`）挂到对应端点
- **同步点**：backend-arch.md 路由表调用链插 `→ protect →`
- **跨层一致性**：verify A7；TE 的 A-2 权限用例（401/403 语义）

## 查询参数类功能（排序/过滤/分页）

- **涉及文件**：纯函数放 `backend/utils/`（先写单测）→ controller 读 `req.query` 接入 → 前端 screen 读写 URL query（`useSearchParams`）→ api 层透传参数
- **同步点**：URL 契约写进 frontend-arch.md「URL 契约」段
- **跨层一致性**：未知参数值必须退化为默认行为不报错（与 specs 域既有退化语义对齐）
