# Harness Engineering（Claude Code 适配完整版）

基于 `training/` 目录的「Harness Engineering」课程完整实现的 AI 研发治理框架，附一个可运行的最小示例宿主项目（迷你商品目录：Express + React + JSON 文件存储，零外部服务依赖）。

> **一句话主张**：Agent 的能力上限取决于模型，交付质量的下限取决于流程。Harness 做的是抬高下限——通过四层递进防线，把"是否完成"的判定依据从 Agent 自述转为**脚本退出码 + 文档产出物 + 角色交叉校验**。

## 系统构成

| 层 | 位置 | 内容 |
|---|---|---|
| 第 1 层 Rules | `CLAUDE.md` + `.harness/rules/` | 三步验证底线、propose 禁碰源码、编码规范、流程纪律 |
| 第 2 层 Skills | `.claude/skills/` | build-test / post-verify / code-review / test-e2e / systematic-debug 五个 SOP |
| 第 3 层 Agents | `.harness/agents/`（7 契约）+ `.claude/agents/`（6 Worker 注册）+ `.harness/workflow/` | PM+BA+SA+RR+Dev+CR+TE 角色制衡；contract.json 机器契约 SSOT；transitions.json 状态机 |
| 第 4 层 Scripts | `.harness/scripts/`（11 脚本）+ `.claude/hooks/`（2 dispatcher） | verify.sh 19 检查点、check-harness.sh 180 项、baseline 回归对比、spec-lint 门禁、E2E 证据对账、SubagentStop/UserPromptSubmit 双 hook |
| 动态记忆层 | `.harness/memory/` | 五段式条目（症状/根因/修复/防复发/复发检测），Developer 单一作者 |
| 备用接口层 | `mcp-server/` + `.mcp.json` | 8 个 MCP 工具（Scripts 上层封装） |

架构详解见 [`.harness/GUIDE.md`](.harness/GUIDE.md)。

## 快速开始

```bash
npm install && (cd frontend && npm install) && (cd mcp-server && npm install)
npm run data:import        # 灌种子
npm run test:all           # 后端 + 前端单测
bash .harness/scripts/verify.sh          # 19 检查点硬校验
bash .harness/scripts/check-harness.sh   # 框架完整性 180 项
npm run test:e2e           # 活跃 E2E 回归集（真实 Chromium）
```

## 三段命令工作流

```
/harness-propose <任务> [描述]   # init → proposal 人机打磨 → BA→SA→(RR)
        🔒 人工审批 1（审阅 deliverables 后手动执行下一条）
/harness-apply [任务]            # Dev(TDD)→hook 旁路验证→CR→TE→三连验证 → AWAITING_ARCHIVE
        🔒 人工审批 2
/harness-archive [任务]          # Spec Merge(+spec-lint 门禁) + Memory Merge + 归档 + DONE
```

三档 profile：`quick`（跳过 RR，SA 在 design 文末写就绪自评）/ `standard`（默认）/ `refactor`（前置 impact-analysis + baseline snapshot）。选档用 proposal 模板里的 4 步判定法，拿不准往上走一档。

## 端到端演示证据（product-sort 任务，standard 档）

本仓库已真实跑通一个完整任务（商品列表排序），归档于 `.harness/deliverables/_archive/product-sort/`：

- **propose**：BA 产出 requirements.md（PRD-R-005/006 + S-010~016，SHALL+GWT）→ SA 产出 design.md（11 章节 + Mermaid 时序 + W-01~05/T-E2E-01~05 归属拆分）→ RR PASS 并带 3 条 ⚠（其中"排序语义须 Model 层直接断言"被 Dev 落实）
- **apply**：Dev TDD（4 个 red-green 循环，38/38 单测）→ developer hook 独立重跑写入 `.hook-results` PASS → CR 14 节报告 PASS（R/S 矩阵 7/7 实证）→ TE 四类测试 24/24（B 类 7 条真实 Chromium + 7 张截图证据，文本↔脚本 1:1）→ tester hook PASS → check-harness 180 项 → 模板残留检测 → AWAITING_ARCHIVE
- **archive**：Spec Merge（products.md 追加 2 R + 7 S，spec-lint 曾拦截 Scenario 注记违规后清洗至 0 ERROR）→ Memory Merge（2 条五段式条目）→ 证据 mv 至 `evidence/` 并改写引用 → board DONE → 终检 180/180
- 交付验证：`npm run test:e2e` 10/10（含 3 条既有回归）

流程中框架自身抓到并修复了 2 个真实缺陷：spec-lint 拦截 Scenario 编号格式违规；TE 上报 bash 3.2 全角字符变量边界坑（已修并落 memory 条目）。

## 移植到其他项目

1. 拷贝 `.harness/`（清空 `deliverables/_archive`、`specs/` 业务域、`memory/entries`、`codebase-guide/`、`tasks/board.md` 数据行）、`.claude/`、`CLAUDE.md`、可选 `mcp-server/ + .mcp.json`
2. 改 `verify.sh` 头部 `# ── project config ──` 变量区（目录、入口文件、白名单、架构面正则）与 A/B/C 检查项命令；改 `backend-smoke.sh` 启动命令；对齐根 `package.json` 的 `test:all / build / data:import / test:e2e` 脚本名
3. 跑 `/codebase-guide-init` 生成代码库知识图谱；按 `_index.md` 领域划分原则建立 specs 初始域
4. `bash .harness/scripts/check-harness.sh` 全绿即可开工（三边校验会揪出所有契约漂移）
5. 注意：`.claude/agents` 与 `settings.json` hooks 在**新会话**生效

## 应急逃生阀

`HARNESS_BYPASS=1`（绕过 hook，事后必须补验证）· `VERIFY_SKIP_CODEBASE_GUIDE=1`（跳 C7，dev-log 写理由）· `VERIFY_FORCE_BUILD=1` / `BUILD_STAMP_DISABLE=1` · `BACKEND_SMOKE_DISABLE=1` · `PLAYWRIGHT_PRUNE_CACHE=1`
