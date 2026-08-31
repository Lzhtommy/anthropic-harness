---
domain: user-auth
summary: "用户域：邮箱密码登录 / 令牌会话 / 个人信息读取 / 未授权拦截 / 管理员权限"
entities: [User]
api_prefixes: ["/api/users"]
last_updated: "bootstrap 2026-08-31"
prefix: AUTH
id_max_r: 3
id_max_s: 7
retired: []
---

# 用户域规约

## Requirements

### Requirement: 邮箱密码登录 (AUTH-R-001)

系统 SHALL 允许用户以邮箱与密码登录；登录成功后签发会话令牌。

#### Scenario: 凭证有效登录成功 (AUTH-S-001)
- **Given** 用户持有有效的邮箱与密码
- **When** 用户提交登录请求
- **Then** 返回用户信息与会话令牌

#### Scenario: 凭证无效被拒绝 (AUTH-S-002)
- **Given** 邮箱或密码错误
- **When** 用户提交登录请求
- **Then** 登录被拒绝并提示凭证无效，不签发令牌

### Requirement: 登录态保护 (AUTH-R-002)

系统 SHALL 拒绝无有效令牌的请求访问需登录能力，并以未授权语义响应。

#### Scenario: 无令牌访问被拦截 (AUTH-S-003)
- **Given** 请求未携带令牌
- **When** 访问需登录能力
- **Then** 请求被拒绝并提示未授权

#### Scenario: 伪造令牌被拦截 (AUTH-S-004)
- **Given** 请求携带被篡改的令牌
- **When** 访问需登录能力
- **Then** 请求被拒绝并提示未授权

#### Scenario: 有效令牌放行 (AUTH-S-005)
- **Given** 请求携带登录时签发的有效令牌
- **When** 访问需登录能力
- **Then** 请求被放行并以该用户身份执行

### Requirement: 个人信息读取与管理员权限 (AUTH-R-003)

系统 SHALL 允许登录用户读取本人信息；管理员专属能力 SHALL 拒绝非管理员访问。

#### Scenario: 登录用户读取本人信息 (AUTH-S-006)
- **Given** 用户已登录
- **When** 请求本人信息
- **Then** 返回本人的名称、邮箱与管理员标识

#### Scenario: 非管理员访问管理员能力被拒 (AUTH-S-007)
- **Given** 用户已登录但不是管理员
- **When** 访问管理员专属能力
- **Then** 请求被拒绝并提示权限不足
