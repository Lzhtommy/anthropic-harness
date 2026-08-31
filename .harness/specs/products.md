---
domain: products
summary: "商品域：列表浏览 / 关键词搜索 / 商品详情 / 404 退化 / 管理员创建商品"
entities: [Product]
api_prefixes: ["/api/products"]
last_updated: "bootstrap 2026-08-31"
prefix: PRD
id_max_r: 4
id_max_s: 9
retired: []
---

# 商品域规约

## Requirements

### Requirement: 商品列表浏览 (PRD-R-001)

系统 SHALL 在首页向所有访客展示商品列表，每件商品呈现名称与价格。

#### Scenario: 打开首页看到全部商品 (PRD-S-001)
- **Given** 系统已导入种子商品
- **When** 访客打开首页
- **Then** 商品列表展示全部商品的名称与价格

#### Scenario: 列表加载失败提示 (PRD-S-002)
- **Given** 商品数据服务不可用
- **When** 访客打开首页
- **Then** 页面展示错误提示，不白屏

### Requirement: 商品关键词搜索 (PRD-R-002)

系统 SHALL 支持按名称关键词过滤商品列表，匹配不区分大小写。

#### Scenario: 关键词命中 (PRD-S-003)
- **Given** 商品库存在名称含 "iPhone" 的商品
- **When** 访客以关键词 "iphone" 请求商品列表
- **Then** 返回的列表仅含名称匹配该关键词的商品

#### Scenario: 关键词未命中返回空列表 (PRD-S-004)
- **Given** 没有任何商品名称含关键词 "zzz"
- **When** 访客以该关键词请求商品列表
- **Then** 返回空列表，不产生错误

### Requirement: 商品详情查看 (PRD-R-003)

系统 SHALL 允许访客查看单件商品的详情（名称、描述、价格）。

#### Scenario: 查看存在的商品 (PRD-S-005)
- **Given** 商品 "Mechanical Keyboard 87 Keys" 存在
- **When** 访客从列表点击进入该商品详情页
- **Then** 页面展示该商品的名称、描述与价格

#### Scenario: 查看不存在的商品 (PRD-S-006)
- **Given** 某商品编号不存在
- **When** 访客直接访问该商品详情地址
- **Then** 页面展示"商品不存在"类错误提示，不白屏

### Requirement: 管理员创建商品 (PRD-R-004)

系统 SHALL 仅允许管理员创建新商品；商品必须包含名称与非负价格。

#### Scenario: 管理员创建成功 (PRD-S-007)
- **Given** 用户以管理员身份登录
- **When** 提交含名称与合法价格的新商品
- **Then** 商品创建成功并进入商品列表

#### Scenario: 未登录用户被拦截 (PRD-S-008)
- **Given** 用户未登录
- **When** 尝试创建新商品
- **Then** 请求被拒绝并提示未授权

#### Scenario: 非法价格被拒绝 (PRD-S-009)
- **Given** 用户以管理员身份登录
- **When** 提交价格为负数或缺少名称的新商品
- **Then** 请求被拒绝并提示输入不合法，商品不被创建
