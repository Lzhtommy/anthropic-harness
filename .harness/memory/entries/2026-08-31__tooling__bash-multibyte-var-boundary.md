---
id: M-20260831-tooling-bash-multibyte-var-boundary
date: 2026-08-31
scope: tooling
tags: [bash, utf8, variable-expansion, macos-bash32]
---

## 症状（怎么爆的）

- 关键报错/日志片段：`TASK�: unbound variable` / `VERIFY_TASK）: unbound variable`
- 触发条件：macOS 系统 bash 3.2 + `set -u` 下，`$VAR` 后**紧跟全角字符**（如 `（` `）` `：`），bash 把多字节字符的部分字节并入变量名

## 根因（为什么会发生）

- 底层机制/不变量被破坏点：旧版 bash 对 UTF-8 多字节边界处理不一致，变量名扫描越过 `$VAR` 边界吞入后续字节，得到不存在的变量名，`set -u` 直接报 unbound
- 为什么以前没暴露：同一脚本在新版 bash / LC_ALL=C 下正常；本项目脚本大量使用中文提示语，首次在 init-task.sh 暴露，修复后又在 verify.sh B4 复发（第二次踩中）

## 修复（怎么修）

- 关键改动点：所有 `$VAR` 后紧跟非 ASCII 字符处一律改为 `${VAR}` 花括号形式（init-task.sh、verify.sh、stage-doc.sh 三处）
- 取舍与约束：不强制全局 LC_ALL=C（会破坏中文输出），从源头规范写法

## 防复发措施（怎么防复发）

- **静态约束**：shell 脚本中变量展开若后接中文/全角标点，必须用 `${VAR}` 形式
- **测试约束**：无
- **验证硬校验**：复发检测 grep（见下）可纳入 check-harness 后续迭代

## 复发检测（机器怎么抓）

- 命令：`grep -rnE '\$[A-Z_]+[（）：，、]' .harness/scripts/*.sh .claude/skills/*/SKILL.md`
- 预期输出/判定：零命中；任何命中即为复发
