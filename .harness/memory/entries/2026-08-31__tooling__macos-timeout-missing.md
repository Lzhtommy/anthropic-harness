---
id: M-20260831-tooling-macos-timeout-missing
date: 2026-08-31
scope: tooling
tags: [timeout, macos, coreutils, smoke-test]
---

## 症状（怎么爆的）

- 关键报错/日志片段：`bash: timeout: command not found`
- 触发条件：在 macOS 上执行含 `timeout 8 node backend/server.js` 的启动守护命令

## 根因（为什么会发生）

- `timeout` 是 GNU coreutils 工具，macOS 默认不提供（brew 装 coreutils 后叫 `gtimeout`）
- 为什么以前没暴露：脚本最初在 Linux CI 环境编写，本机验证时才首次跑 macOS

## 修复（怎么修）

- 关键改动点：启动守护改为三级自适应——`timeout` > `gtimeout` > 后台起进程 + sleep 探活 + kill
- 取舍与约束：无守护降级路径下必须显式 kill，避免进程泄漏

## 防复发措施（怎么防复发）

- **静态约束**：新脚本禁止裸用 `timeout`，必须走 `backend-smoke.sh` 的 run_guarded 模式
- **测试约束**：无（脚本层问题）
- **验证硬校验**：verify.sh B3 统一走 `backend-smoke.sh`（内置自适应），不再散落各处手写 timeout

## 复发检测（机器怎么抓）

- 命令：`grep -rn 'timeout [0-9]' .harness/scripts/ --include='*.sh' | grep -v 'command -v timeout' | grep -v gtimeout`
- 预期输出/判定：仅 backend-smoke.sh 的 run_guarded 分支命中；其他脚本命中即为复发
