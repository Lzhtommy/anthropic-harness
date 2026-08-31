# [需求名称] — 开发日志（Dev 产出）

## 导航头
- R/S 覆盖：R-xxx、S-xxx
- 文档状态：Draft / Updated

> 写入纪律：完全重写，禁止占位符残留与尾部追加。
> 首轮实现完成（未被打回）时「本轮增量变更」整节**删除**——仅在第 n 轮被 CR/TE 打回时才填。

## 实现摘要

简述本次实现了什么。

## 偏离说明

（与 design 的任何偏差及原因；无则写"无"）

## 代码变更清单

| 文件 | 操作 | 对应 R/S | 说明 |
|---|---|---|---|

## 就绪对齐记录（强制）

（就绪背书——standard/refactor 读 readiness-review.md，quick 读 design.md 的 `## 就绪自评`——中与本次实现相关的风险/阻塞/待确认项如何关闭；未关闭写明原因）

## 本轮增量变更（被打回时必填，首轮删除本节）

（触发原因 + 本轮只改了什么：文件 + R/S + 影响说明，便于 CR/TE 增量审查）

## 回退/踩坑记录（被打回时强制；Dev 是 memory 唯一作者）

（综合 CR「必改问题表」/ TE「失败项详情」+ 自己的修复，按五段式写草稿：
症状 → 根因 → 修复 → 防复发措施 → 计划条目名 `YYYY-MM-DD__scope__slug.md`。
一次通过的任务本节写"无"。）

## 验证证据链（强制）

（必须贴命令 + 关键输出摘要，禁止只写 PASS）

```
$ npm run test:all
（粘贴 build-test Skill 的实际输出）
```

## build-test / post-verify 结果

- build-test：PASS / FAIL（明细）
- post-verify（verify.sh + baseline compare）：PASS / FAIL（明细）

## 已知遗留问题

（无则写"无"）

## 结论

PASS / FAIL / BLOCK
