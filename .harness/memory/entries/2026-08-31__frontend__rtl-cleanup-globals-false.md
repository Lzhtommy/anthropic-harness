---
id: M-20260831-frontend-rtl-cleanup-globals-false
date: 2026-08-31
scope: frontend
tags: [testing-library, cleanup, vitest, globals]
---

## 症状（怎么爆的）

- 关键报错/日志片段：`Found multiple elements by: [data-testid=...]`（第 2 个及之后用例报错，首个用例通过）
- 触发条件：同一组件测试文件内多条用例查询相同 testid（ProductListScreen.test.jsx）

## 根因（为什么会发生）

- 底层机制/不变量被破坏点：`frontend/vite.config.js` 设 `test.globals: false`，@testing-library/react 的 auto-cleanup 依赖全局 `afterEach` 存在才注册，故跨用例 DOM 未卸载、渲染树累积
- 为什么以前没暴露：既有 `Price.test.jsx` 两条用例断言文本互不相同，DOM 累积不影响查询结果

## 修复（怎么修）

- 关键改动点：测试文件内显式 `afterEach(() => cleanup())`
- 取舍与约束：保持 `globals: false`（显式 import 风格）；不改全局配置以免影响既有文件

## 防复发措施（怎么防复发）

- **静态约束**：新增前端组件测试文件必须显式 cleanup（或在 vite.config 加 `test.setupFiles` 统一注册——后续基建任务）
- **测试约束**：断言使用重复 testid 的测试文件是必踩场景，评审时重点看
- **验证硬校验**：暂无（组件测试失败会被 npm run test:all / developer hook 拦截）

## 复发检测（机器怎么抓）

- 命令：`grep -rL 'cleanup' frontend/src/**/*.test.jsx`（列出未含 cleanup 的组件测试文件）交叉 `grep -l 'getAllBy\|getByTestId'`
- 预期输出/判定：多用例查询同 testid 的测试文件必须含 cleanup，否则视为复发风险
