# 工程记忆索引

> Developer 启动时**强制先扫本索引**：按 scope 判断本任务是否涉及，命中再读 entries/ 全文（重点看「防复发措施」「复发检测」两段）。
> 写入规则：Developer 单一作者（在 dev-log「回退/踩坑记录」写草稿），PM 归档时逐条**原样**落盘 entries/ 并更新本索引。一次通过的任务不写。

## backend

（暂无条目）

## frontend

- [2026-08-31__frontend__rtl-cleanup-globals-false](entries/2026-08-31__frontend__rtl-cleanup-globals-false.md) — vitest `globals:false` 下 RTL auto-cleanup 失效，组件测试须显式 cleanup

## tooling

- [2026-08-31__tooling__macos-timeout-missing](entries/2026-08-31__tooling__macos-timeout-missing.md) — macOS 默认无 GNU timeout，长驻进程守护须自适应降级
- [2026-08-31__tooling__bash-multibyte-var-boundary](entries/2026-08-31__tooling__bash-multibyte-var-boundary.md) — bash 3.2 下 `$VAR` 后紧跟全角字符被吞入变量名，一律写 `${VAR}`

## infra

（暂无条目）

## shared

（暂无条目）
