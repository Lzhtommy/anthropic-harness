---
name: systematic-debug
description: 系统化调试 SOP。Developer 遇到任何 FAIL（单测/构建/verify/运行时）时必走；禁止不经此流程盲改代码。含 Memory 前置检索与三次失败刹车线。
---

# systematic-debug — 系统化调试 SOP

任何 FAIL 不经本流程**禁止动代码**。按 7 步执行：

## Step 1 先查 Memory

```bash
grep -ril "<关键词>" .harness/memory/entries/
```
命中 → 读该条目的「修复」「防复发措施」，按方案执行后跳 Step 6；未命中 → 继续。

## Step 2 读完整错误信息

读全堆栈/断言差异，不是只看最后一行。

## Step 3 稳定复现

优先最小复现：`npx vitest run <单个测试文件> -t "<用例名>"`。偶发失败不许放过。

## Step 4 对照最近改动

```bash
git diff HEAD~1 --stat
git diff HEAD~1 -- <出错文件>
```
（工作区未提交时用 `git diff`）

## Step 5 定位边界

console.log 插桩或二分法，缩小到"哪一层坏了"。
分类关注点：单测 FAIL → 断言差异 + mock；verify FAIL → 哪项 A/B/C；前端构建 FAIL → import 路径/JSX/依赖（看尾部 20 行）；后端启动 FAIL → 端口/.env（第一个 Error）；E2E FAIL → DOM 变化/异步时序/定位器失效（Timeout + 截图）。

## Step 6 单一假设 + 最小验证

一次只改一个点，改完立刻重跑复现命令。禁止同时改多处、禁止顺手重构。

## Step 7 修根因不修症状

确认根因后再改正式代码；修完全量重跑（npm run test:all + verify）。

## 三次失败刹车线

同一问题 3 次尝试仍不通过 → **立刻停止**，在 dev-log.md 追加：

```
## 阻塞项
### <问题一句话描述>
- **FAIL 来源**：单测 / verify / 构建 / 运行时
- **复现命令**：`<可直接复制跑的命令>`
- **已尝试**：
  1. 假设 A → 改了 xxx → 结果：仍 FAIL（原因：...）
  2. 假设 B → 改了 yyy → 结果：仍 FAIL（原因：...）
  3. 假设 C → 改了 zzz → 结果：仍 FAIL（原因：...）
- **当前判断**：<对根因的最新推测>
- **需要**：改方案 / 拆任务 / 人介入
```

## 收尾：是否值一条 Memory

模式性的坑（会再踩）→ 按 `.harness/memory/templates/entry.md` 五段式在 dev-log 写草稿；拼写笔误类 → 不记。
