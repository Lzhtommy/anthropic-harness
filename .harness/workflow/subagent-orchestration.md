# Subagent 编排说明（一体模式）

## 编排模式

主会话同时充当 Bootstrap 和 PM：命令入口读取 `project-manager.md` 全文后切换 PM 身份，通过 **Agent 工具**链式拉起 6 个 Worker subagent。

**为什么 PM 不注册为 subagent**：PM 需要用 Agent 工具拉 Worker，而 subagent 内部不能再嵌套 Agent 调用；若 PM 也注册为 subagent 就失去调度能力。PM 始终在主会话扮演，契约仍读 `.harness/agents/project-manager.md`。

## 6 个 Worker（注册于 .claude/agents/）

| 注册名 | 主产出 |
|---|---|
| business-analyst | requirements.md |
| solution-architect | design.md（refactor 档另出 impact-analysis.md） |
| readiness-reviewer | readiness-review.md |
| developer | 代码 + 单测 + dev-log.md |
| code-reviewer | code-review.md |
| test-engineer | test-report.md + e2e 资产 + 浏览器证据 |

## PM 调度 Worker 的参数消息规范

首条参数消息只写任务参数，**不写**"你是 Harness..."之类角色声明（角色由 subagent 定义文件注入）：

```
TASK_NAME=<任务目录名>
PROFILE=<quick|standard|refactor>          # apply 段必填
就绪依据=<readiness-review.md | design.md 的 ## 就绪自评 段>   # apply 段必填
上一轮结论=<RE-RUN（用户反馈）: 一句现象>   # re-run 时填
```

Worker 按自身契约读必读文件并产出文档，文末 `## 结论` 只写合法结论词。

## 上下文管理

每个 Worker 只接收 contract.json `roles.<agent>.inputs` 列出的文件（省窗口 + 防干扰）。
一致性由 check-harness.sh 三边校验强制：**contract.json ↔ .claude/agents/*.md 的「## 必读」 ↔ 本文件附录**，任一侧漂移 FAIL。

---

## 附录：各 Worker 必读清单（与 contract.json 严格一致）

### business-analyst
- .harness/agents/business-analyst.md
- .harness/deliverables/<task>/proposal.md
- .harness/specs/_index.md
- .harness/codebase-guide/overview.md
- .harness/tasks/board.md

### solution-architect
- .harness/agents/solution-architect.md
- .harness/deliverables/<task>/requirements.md
- .harness/codebase-guide/overview.md
- .harness/codebase-guide/backend-arch.md
- .harness/codebase-guide/frontend-arch.md
- .harness/codebase-guide/deps.md

### readiness-reviewer
- .harness/agents/readiness-reviewer.md
- .harness/deliverables/<task>/requirements.md
- .harness/deliverables/<task>/design.md
- .harness/codebase-guide/overview.md
- .harness/specs/_index.md

### developer
- .harness/agents/developer.md
- .harness/rules/code-standards.md
- .harness/deliverables/<task>/requirements.md
- .harness/deliverables/<task>/design.md
- .harness/deliverables/<task>/readiness-review.md
- .harness/memory/index.md
- .harness/codebase-guide/overview.md
- .harness/codebase-guide/backend-arch.md
- .harness/codebase-guide/frontend-arch.md
- .harness/codebase-guide/deps.md
- .harness/codebase-guide/dev-recipes.md
- .claude/skills/build-test/SKILL.md
- .claude/skills/post-verify/SKILL.md
- .claude/skills/systematic-debug/SKILL.md

### code-reviewer
- .harness/agents/code-reviewer.md
- .claude/skills/code-review/SKILL.md
- .harness/deliverables/<task>/requirements.md
- .harness/deliverables/<task>/design.md
- .harness/deliverables/<task>/readiness-review.md
- .harness/deliverables/<task>/dev-log.md
- .harness/codebase-guide/backend-arch.md
- .harness/codebase-guide/frontend-arch.md
- .harness/codebase-guide/deps.md
- git diff

### test-engineer
- .harness/agents/test-engineer.md
- .claude/skills/test-e2e/SKILL.md
- .claude/skills/build-test/SKILL.md
- .claude/skills/post-verify/SKILL.md
- .harness/deliverables/<task>/requirements.md
- .harness/deliverables/<task>/design.md
- .harness/deliverables/<task>/code-review.md

### Profile 变体
- quick：developer / code-reviewer 的必读清单中移除 `.harness/deliverables/<task>/readiness-review.md`（就绪依据改为 design.md 的 `## 就绪自评`）
- refactor：business-analyst / readiness-reviewer 追加 `.harness/deliverables/<task>/impact-analysis.md`；SA 的 impact 阶段必读见 contract.json `profile_variants.refactor.impact_stage.inputs`
