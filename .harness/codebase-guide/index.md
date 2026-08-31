# 代码库指南（索引）

> 入口索引：只做查表，不存放内容。token-budget ≤400。

## 子文件摘要表

| 文件 | 内容 | 典型读者 |
|---|---|---|
| overview.md | 项目简介、技术栈、关键命令、Harness 角色索引 | 所有 Agent |
| backend-arch.md | Express 分层：入口、路由表 + 调用链一行式、Model、Controller、中间件、种子、测试 | SA / Dev / CR |
| frontend-arch.md | React 客户端：路由树、api 薄封装、组件库、URL 契约 | SA / Dev / CR |
| deps.md | 外部依赖地图：依赖 × 用途 × 关键使用点 | SA / Dev / CR |
| dev-recipes.md | 常见开发场景：涉及文件 + 同步点 + 跨层一致性 | Dev |

## 按需加载规则

各角色必读清单以 `.harness/workflow/contract.json` 的 `roles.<agent>.inputs` 为准。

## 新增子文件时的登记要求

1. 顶部一行引用格式写清「负责什么 + 谁要读」
2. 在本索引摘要表登记一行
3. 同时挂载 `contract.json` 的 `roles.<worker>.inputs` 与 `.claude/agents/<worker>.md` 必读段（两处必须一致，否则 check-harness 三边校验 FAIL）
4. 跑 `bash .harness/scripts/check-harness.sh` 验证
