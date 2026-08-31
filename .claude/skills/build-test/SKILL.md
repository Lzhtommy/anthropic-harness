---
name: build-test
description: 构建 + 测试验证 SOP。Developer 完成代码后必走：单测全量 → 后端启动冒烟 → 前端构建 → 种子一致性 → 汇总报告。任一 FAIL → 整体 FAIL，禁止提交 dev-log。
---

# build-test — 构建与测试验证 SOP

按固定 5 步执行，任一步 FAIL → 整体 FAIL，转 systematic-debug Skill。

## Step 1 单元测试全量

```bash
npm run test:all
```
判定：passed > 0 且 failed = 0 才算 PASS。记录 passed/failed 计数。

## Step 2 后端启动冒烟

```bash
bash .harness/scripts/backend-smoke.sh
```
（内置端口自选与 timeout 自适应；环境问题不判代码失败）

## Step 3 前端构建（优先命中指纹缓存）

```bash
BUILD_STAMP=.harness/scripts/build-stamp.sh

if [ -x "$BUILD_STAMP" ] && "$BUILD_STAMP" check >/dev/null 2>&1; then
  echo "✅ 前端构建成功（stamp 命中，跳过重建）"
elif ( cd frontend && npm run build 2>&1 ); then
  echo "✅ 前端构建成功"
  [ -x "$BUILD_STAMP" ] && "$BUILD_STAMP" write >/dev/null 2>&1 || true
else
  echo "❌ 前端构建失败"
fi
```
缓存脏了：`BUILD_STAMP_DISABLE=1` 强制重建，或 `bash .harness/scripts/build-stamp.sh invalidate`。

## Step 4 种子数据一致性

```bash
node backend/seeder.js
```
判定：退出码 0。

## Step 5 汇总报告（强制格式）

```
=== 构建与测试报告 ===
单元测试: PASS / FAIL（X passed, Y failed）
后端启动: PASS / FAIL
前端构建: PASS / FAIL
种子数据: PASS / FAIL
总结论:   PASS / FAIL
```

把本报告原样粘贴进 dev-log.md 的「验证证据链」。
