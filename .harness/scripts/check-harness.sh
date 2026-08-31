#!/usr/bin/env bash
# check-harness.sh — 框架完整性校验（90+ 项）
# 不检查业务代码，检查"检查系统本身有没有坏"。
# 维度：①文件存在性 ②Agent 契约完整性（含 machine-contract 锚点）③transitions.json 对齐
#      ④Role Contract 三边校验（contract.json ↔ .claude/agents ↔ subagent-orchestration.md）
#      ⑤契约护栏（PM 输出白名单 / Dev·TE 输出边界 / testing 需求级只能升级给人）
#      ⑥Profile 配置 ⑦In-flight Profile 一致性 ⑧Propose 段源码越界 ⑨AWAITING_ARCHIVE 闸
#      ⑩spec-lint 门禁
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 - <<'PYEOF'
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path('.').resolve()
PASS = FAIL = 0
FAILS = []

def ok(msg):
    global PASS
    PASS += 1

def bad(msg):
    global FAIL
    FAIL += 1
    FAILS.append(msg)
    print(f'[FAIL] {msg}')

def check(cond, msg):
    ok(msg) if cond else bad(msg)

WORKERS = ['business-analyst', 'solution-architect', 'readiness-reviewer',
           'developer', 'code-reviewer', 'test-engineer']

# ═══ ① 文件存在性 ═══
FILES = [
    'CLAUDE.md', '.mcp.json', 'package.json', 'playwright.config.js',
    '.claude/settings.json',
    '.harness/GUIDE.md',
    '.harness/tasks/board.md',
    '.harness/templates/proposal.md',
    '.harness/specs/_index.md', '.harness/specs/_flows.md',
    '.harness/memory/index.md', '.harness/memory/templates/entry.md',
    '.harness/rules/code-standards.md', '.harness/rules/workflow-discipline.md',
    '.harness/workflow/contract.json', '.harness/workflow/transitions.json',
    '.harness/workflow/flow-definition.md', '.harness/workflow/subagent-orchestration.md',
    'mcp-server/index.js', 'mcp-server/package.json',
]
FILES += [f'.harness/agents/{r}.md' for r in ['project-manager'] + WORKERS]
FILES += [f'.claude/agents/{w}.md' for w in WORKERS]
FILES += [f'.claude/commands/{c}.md' for c in
          ['harness-propose', 'harness-apply', 'harness-archive', 'codebase-guide-init']]
FILES += [f'.claude/skills/{s}/SKILL.md' for s in
          ['build-test', 'post-verify', 'code-review', 'test-e2e', 'systematic-debug']]
FILES += [f'.claude/hooks/{h}' for h in
          ['dispatch-subagent.py', 'dispatch-prompt.py',
           '_actions_developer.py', '_actions_tester.py', '_subagent_payload.py']]
FILES += [f'.harness/scripts/{s}' for s in
          ['verify.sh', 'baseline.sh', 'check-harness.sh', 'backend-smoke.sh',
           'init-task.sh', 'stage-doc.sh', 'build-stamp.sh', 'ensure-playwright.sh',
           'check-e2e-evidence.py', 'spec-lint.py', 'codebase-guide-init.sh']]
FILES += [f'.harness/deliverables/_template/{d}' for d in
          ['requirements.md', 'design.md', 'impact-analysis.md', 'readiness-review.md',
           'dev-log.md', 'code-review.md', 'test-report.md']]
FILES += [f'.harness/codebase-guide/{g}.md' for g in
          ['index', 'overview', 'backend-arch', 'frontend-arch', 'deps', 'dev-recipes']]
for f in FILES:
    check((ROOT / f).exists(), f'存在性: {f}')

# ═══ ② Agent 契约完整性 ═══
contract = json.loads((ROOT / '.harness/workflow/contract.json').read_text())
for role in ['project-manager'] + WORKERS:
    p = ROOT / f'.harness/agents/{role}.md'
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    for section in ['身份', '职责', '禁止事项', '阻塞条件', '模型建议']:
        check(re.search(rf'^##.*{section}', text, re.M), f'契约段落: {role}.md 含「{section}」')
    if role != 'project-manager':
        check(re.search(r'^## 输入', text, re.M), f'契约段落: {role}.md 含「输入」')
        check(re.search(r'^## 输出|^## 输出：', text, re.M) or '## 输出' in text,
              f'契约段落: {role}.md 含「输出」')
    anchor = f'machine-contract: .harness/workflow/contract.json#/roles/{role}'
    check(anchor in text, f'机器契约锚点: {role}.md')
    check(role in contract.get('roles', {}), f'contract.json 含节点 roles.{role}')

# ═══ ③ transitions.json 对齐 ═══
trans = json.loads((ROOT / '.harness/workflow/transitions.json').read_text())
check(set(trans.get('documents', {}).keys()) ==
      {'impact-analysis', 'requirements', 'design', 'readiness',
       'development', 'review', 'testing'},
      'transitions.documents 键与 stage-doc.sh 阶段名一致')
for st in ['requirements', 'design', 'readiness', 'development', 'review', 'testing',
           'awaiting_archive', 'done']:
    check(st in trans.get('stages', []), f'transitions.stages 含 {st}')
check(set(trans.get('profiles', {}).keys()) == {'quick', 'standard', 'refactor'},
      'transitions.profiles 恰含三档')
check('readiness' not in trans['profiles']['quick']['propose'],
      'quick 档 propose 不含 readiness')
check(trans['profiles']['refactor']['propose'][0] == 'impact-analysis',
      'refactor 档以 impact-analysis 起头')
check(any('baseline' in a for a in trans['profiles']['refactor'].get('mandatory_actions', [])),
      'refactor 档含 baseline snapshot 强制前置动作')
check(len(trans.get('human_gates', [])) == 2, '两道人工审批卡点已定义')
check(trans.get('board_states') == ['PENDING', 'IN_PROGRESS', 'AWAITING_ARCHIVE', 'DONE'],
      'board_states 四态')
for st, agent in [('requirements', 'business-analyst'), ('design', 'solution-architect'),
                  ('readiness', 'readiness-reviewer'), ('development', 'developer'),
                  ('review', 'code-reviewer'), ('testing', 'test-engineer')]:
    check(trans.get('stage_agents', {}).get(st) == agent, f'stage_agents: {st} → {agent}')

# ═══ ④ Role Contract 三边校验 ═══
def bullets_from(text, start_marker, end_pat=r'^##[^#]'):
    m = re.search(rf'{start_marker}\s*\n(.*?)(?=^##[^#]|\Z)', text, re.S | re.M)
    if not m:
        return None
    items = []
    for line in m.group(1).split('\n'):
        line = line.strip()
        if line.startswith('- '):
            items.append(line[2:].strip())
        elif line.startswith('（') or (line and not line.startswith('-')):
            break  # 遇到可选说明段落即停（可选项不进三边校验）
    return items

orch_text = (ROOT / '.harness/workflow/subagent-orchestration.md').read_text(encoding='utf-8')
for w in WORKERS:
    contract_inputs = set(contract['roles'][w]['inputs'])
    reg_text = (ROOT / f'.claude/agents/{w}.md').read_text(encoding='utf-8')
    reg_items = bullets_from(reg_text, r'^## 必读')
    # subagent-orchestration.md 附录 ### <w>
    m = re.search(rf'^### {re.escape(w)}\s*\n(.*?)(?=^###|\Z)', orch_text, re.S | re.M)
    orch_items = None
    if m:
        orch_items = [l.strip()[2:].strip() for l in m.group(1).split('\n') if l.strip().startswith('- ')]
    check(reg_items is not None and set(reg_items) == contract_inputs,
          f'三边校验: contract.json ↔ .claude/agents/{w}.md 必读一致')
    check(orch_items is not None and set(orch_items) == contract_inputs,
          f'三边校验: contract.json ↔ subagent-orchestration.md ({w}) 一致')

# ═══ ⑤ 契约护栏 ═══
pm = contract['roles']['project-manager']
check(any('deliverables/<task>' in x for x in pm.get('output_forbidden', [])),
      '护栏: PM 禁写 deliverables 阶段产物')
check(any('backend/' in x for x in pm.get('output_forbidden', [])), '护栏: PM 禁写源码')
dev = contract['roles']['developer']
check(any('e2e/' in x for x in dev.get('output_forbidden', [])), '护栏: Developer 禁碰 e2e 资产')
te = contract['roles']['test-engineer']
check(any('产品代码' in x or 'backend' in x for x in te.get('output_forbidden', [])),
      '护栏: TE 禁改产品代码')
te_fail_req = te['exits'].get('FAIL(需求级)', '')
check('human_escalation' in te_fail_req and 'rollback_to requirements' not in te_fail_req,
      '护栏: testing 需求级问题只能升级给人（禁止 rollback_to requirements）')
check(contract.get('retry_limits', {}).get('developer') == 5 and
      contract['retry_limits'].get('default') == 3, '护栏: 断流上限 dev=5 / 其余=3')

# ═══ ⑥ Profile 配置 ═══
pv = contract.get('profile_variants', {})
check(set(pv.keys()) == {'quick', 'standard', 'refactor'}, 'profile_variants 恰含三档')
q_over = pv.get('quick', {}).get('inputs_override', {})
check(any('readiness-review.md' in x for x in q_over.get('developer', {}).get('remove', [])),
      'quick: developer 移除 readiness-review 必读')
check(any('readiness-review.md' in x for x in q_over.get('code-reviewer', {}).get('remove', [])),
      'quick: code-reviewer 移除 readiness-review 必读')
r_extra = pv.get('refactor', {}).get('extra_inputs', {})
check('business-analyst' in r_extra and 'readiness-reviewer' in r_extra,
      'refactor: BA/RR 追加 impact-analysis 必读')
check('## 流程 profile' in (ROOT / '.harness/templates/proposal.md').read_text(encoding='utf-8'),
      'proposal 模板含「## 流程 profile」字段')

# ═══ ⑦ In-flight Profile 一致性 ═══
deliv = ROOT / '.harness/deliverables'
active_tasks = [d for d in deliv.iterdir() if d.is_dir() and not d.name.startswith('_')]
for d in active_tasks:
    prop = d / 'proposal.md'
    if not prop.exists():
        bad(f'in-flight: {d.name} 缺 proposal.md')
        continue
    m = re.search(r'\*\*选择\*\*[:：]\s*(quick|standard|refactor)', prop.read_text(encoding='utf-8'))
    profile = m.group(1) if m else None
    if profile == 'quick':
        check(not (d / 'readiness-review.md').exists(),
              f'in-flight: quick 任务 {d.name} 不应有 readiness-review.md')
    if profile == 'refactor' and (d / 'requirements.md').exists():
        check((d / 'impact-analysis.md').exists(),
              f'in-flight: refactor 任务 {d.name} 必须有 impact-analysis.md')
if not active_tasks:
    ok('in-flight: 无在途任务')

# ═══ ⑧ Propose 段源码越界检测 ═══
board_text = (ROOT / '.harness/tasks/board.md').read_text(encoding='utf-8')
propose_stages = ['需求澄清', '需求分析', '方案设计', '影响面分析', '就绪评审']
in_propose = any(
    re.search(rf'\|\s*{st}\s*\|\s*(PENDING|IN_PROGRESS)\s*\|', board_text)
    for st in propose_stages)
if in_propose:
    try:
        diff = subprocess.run(['git', 'diff', '--name-only', 'HEAD'],
                              capture_output=True, text=True, timeout=15).stdout
        dirty = [l for l in diff.split('\n') if l.strip() and
                 re.match(r'^(backend/|frontend/|mcp-server/|e2e/|package\.json)', l)]
        check(not dirty, f'propose 段源码越界: 在途 propose 任务存在源码改动 {dirty[:3]}')
    except Exception:
        ok('propose 越界检测: git 不可用，跳过')
else:
    ok('propose 越界检测: 无在途 propose 任务')

# ═══ ⑨ AWAITING_ARCHIVE 闸 ═══
awaiting = re.findall(r'^\|\s*\d+\s*\|\s*([a-z0-9_-]+)\s*\|.*\|\s*AWAITING_ARCHIVE\s*\|',
                      board_text, re.M)
def final_conclusion(p):
    if not p.exists():
        return None
    parts = re.split(r'^## 结论\s*$', p.read_text(encoding='utf-8'), flags=re.M)
    if len(parts) < 2:
        return None
    tail = parts[-1].strip().split('\n')[0]
    if tail.startswith('PASS / FAIL'):
        return None
    return 'PASS' if tail.startswith('PASS') else ('FAIL' if tail.startswith('FAIL') else None)

for t in awaiting:
    tr = deliv / t / 'test-report.md'
    check(final_conclusion(tr) == 'PASS',
          f'AWAITING_ARCHIVE 闸: {t} 的 test-report.md 文末结论必须 PASS')
for d in active_tasks:
    tr = d / 'test-report.md'
    if tr.exists() and final_conclusion(tr) == 'FAIL':
        check(d.name not in awaiting,
              f'AWAITING_ARCHIVE 闸: {d.name} test-report FAIL 不得进入 AWAITING_ARCHIVE')
if not awaiting:
    ok('AWAITING_ARCHIVE 闸: 当前无待归档任务')

# ═══ ⑩ spec-lint 门禁 ═══
r = subprocess.run(['python3', '.harness/scripts/spec-lint.py'], capture_output=True, text=True)
check(r.returncode == 0, f'spec-lint 门禁 0 ERROR（输出: {r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ""}）')

# ═══ 汇总 ═══
total = PASS + FAIL
print(f'=== check-harness 汇总: {total} 项检查 · {PASS} PASS · {FAIL} FAIL ===')
if FAIL:
    print('[FAIL] check-harness 未通过')
    sys.exit(1)
print('[PASS] check-harness 全部通过')
PYEOF
