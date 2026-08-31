---
description: 首次生成 codebase-guide（两段式：脚本扫通用事实 → AI 探拓扑填语义 → 质量标尺自检 → 机器校验 → 交付人工审阅）
argument-hint: "[--force|--dry-run]"
---

# /codebase-guide-init $ARGUMENTS

核心设计：AI 当适配器，脚本不假设技术栈。

## Step 1 脚本扫事实 + 渲染骨架

```bash
bash .harness/scripts/codebase-guide-init.sh $ARGUMENTS
```
产出 `.reports/codebase-guide-init-facts.txt` + 6 份含 `<!-- TODO -->` 的骨架。目录非空默认拒绝（先 `git mv .harness/codebase-guide .harness/codebase-guide.bak` 备份再跑；不要直接 --force）。

## Step 2 AI 探测项目拓扑

读 facts.txt，配合 Read/Glob/Grep 判断：项目类型 / 服务端语言框架 / 数据层 / 客户端框架 / 状态管理 / 路由 / 测试栈——每条给出实证文件路径。

## Step 3 按骨架填语义

逐份读 `<!-- TODO: ... -->` 标注并补齐内容，**严禁越过 TODO 边界扩写**。调用链一行式格式：`**动词** 路径 → 中间件 → Controller 方法 → Model/Util 调用（关键参数）`。

## Step 4 质量标尺自检

三条通用标尺：具体化（不写"处理相关逻辑"这类空话）/ 签名级（方法、路径可直接对照源码）/ 与代码同步。专属质量门：backend-arch 每个路由前缀 ≥1 条调用链；frontend-arch 每个状态单元一句话职责。不达标回 Step 3。

## Step 5 机器校验 + 抽查 + 交付人工

跑 `bash .harness/scripts/verify.sh`（C7）+ 交叉抽查（随机 2-3 条路由核对源码、3 个依赖验关键使用点）→ 输出抽查报告 → **停下提示用户审阅，不自作主张 commit**。
