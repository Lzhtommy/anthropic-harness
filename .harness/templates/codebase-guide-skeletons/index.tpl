# 代码库指南（索引）

> 入口索引：只做查表，不存放内容。token-budget ≤400。

## 子文件摘要表

| 文件 | 内容 | 典型读者 |
|---|---|---|
| overview.md | <!-- TODO: 一句话 --> | 所有 Agent |
| backend-arch.md | <!-- TODO: 一句话 --> | SA / Dev / CR |
| frontend-arch.md | <!-- TODO: 一句话 --> | SA / Dev / CR |
| deps.md | <!-- TODO: 一句话 --> | SA / Dev / CR |
| dev-recipes.md | <!-- TODO: 一句话 --> | Dev |

## 按需加载规则

各角色必读清单以 `.harness/workflow/contract.json` 的 `roles.<agent>.inputs` 为准。

## 新增子文件时的登记要求

1. 顶部一行引用格式写清「负责什么 + 谁要读」
2. 在本索引摘要表登记一行
3. 同时挂载 `contract.json` 的 `roles.<worker>.inputs` 与 `.claude/agents/<worker>.md` 必读段（两处必须一致）
4. 跑 `bash .harness/scripts/check-harness.sh` 验证
