# 服务端架构

> Express 分层、路由表与调用链。SA、Dev、CR 必读。

## 入口与路由注册

- `backend/server.js`：启动入口，读 `backend/config.js`（端口/密钥唯一来源）
- `backend/app.js`：express 实例；`express.json()` → 挂路由 → `notFound` → `errorHandler`

### 路由表（调用链一行式）

`/api/products`（backend/routes/productRoutes.js）：
```
**GET** / → productController.getProducts → Product.find (keyword 过滤，大小写不敏感)
**GET** /:id → productController.getProductById → Product.findById（不存在 404）
**POST** / → protect → admin → productController.createProduct → Product.create（缺 name/负价 400）
```

`/api/users`（backend/routes/userRoutes.js）：
```
**POST** /login → userController.authUser → User.findByEmail + issueToken（凭证错 401）
**GET** /profile → protect → userController.getUserProfile → req.user 投影
```

## 数据模型

- `backend/models/productModel.js`（Product）：id / name / price / description / createdAt；find({keyword}) / findById / create（id 自增取 store.nextId）
- `backend/models/userModel.js`（User）：id / name / email / password / isAdmin；findByEmail（大小写不敏感）/ findById
- 存储层 `backend/db/store.js`：read / write / reset / nextId，落盘 `backend/data/db.json`（gitignore）。**Model 禁止绕过 store 直接 import fs（verify A3）**

## Controller 模式

- productController：getProducts / getProductById / createProduct
- userController：authUser / getUserProfile
- 全部导出用 asyncHandler 包裹（verify A2）

## 中间件

- `asyncHandler.js`：Promise 错误统一转 next(err)
- `errorMiddleware.js`：notFound（404 透传）+ errorHandler（statusCode 保留，JSON message）
- `authMiddleware.js`：protect（Bearer token → verifyToken → User.findById → req.user，失败 401）；admin（req.user.isAdmin，否则 403）

## 工具函数

- `utils/token.js`：issueToken（base64url payload + HMAC-SHA256 签名）/ verifyToken（timingSafeEqual）
- `utils/formatPrice.js`：金额格式化纯函数（非法输入退化 '0.00'）

## 种子数据

- `backend/seeder.js`：读 `backend/data/seed/{products,users}.json`，store.reset 重建（破坏性）
- 种子：5 件商品；2 个用户（admin@email.com 管理员 / john@email.com 普通，密码均 123456）

## 测试

- `backend/__tests__/{utils,controllers,middleware}/*.test.js`，Vitest node 环境，Model 全 vi.mock
- 运行：`npm run test:backend`（根 vitest.config.js 限定 include）
