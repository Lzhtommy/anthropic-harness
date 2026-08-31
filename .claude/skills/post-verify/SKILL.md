---
name: post-verify
description: 事后验证 SOP。build-test 通过后必走：运行 verify.sh（19 检查点）并解析结果，baseline 存在时做回归对比。任何 FAIL → 不通过。
---

# post-verify — 事后验证 SOP

## Step 1 运行总验证

```bash
bash .harness/scripts/verify.sh 2>&1
```
（19 检查点：A 类 8 + B 类 4 + C 类 7，含 C7 codebase-guide 同步硬校验）

## Step 2 解析结果

统计输出中的 `[PASS]` / `[FAIL]` / `[WARN]` 行。

## Step 3 判定

- 任何 `[FAIL]` → 整体不通过（转 systematic-debug）
- 只有 `[WARN]` + `[PASS]` → 通过（WARN 应修但不阻塞，记入 dev-log 遗留问题）

## Step 4 输出总表（强制格式）

```
=== 事后验证报告 ===
通过: X 项
警告: Y 项
失败: Z 项
总结论: PASS / FAIL

失败项明细:
  1. [FAIL] xxx — 具体原因
警告项明细:
  1. [WARN] zzz — 建议处理
```

## Step 5 基线对比（baseline.json 存在时）

```bash
bash .harness/scripts/baseline.sh compare
```
出现**新增 FAIL** → 整体 FAIL（regression 属实现问题回 Dev；测试资产/环境/上游口径问题不得默认打回 Dev，报告写明归属）。

## 应急

C7 误伤时：`VERIFY_SKIP_CODEBASE_GUIDE=1 bash .harness/scripts/verify.sh`（**必须**在 dev-log「codebase-guide 同步」节写 N/A + 理由，CR 会审计）。
