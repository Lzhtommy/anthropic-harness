#!/usr/bin/env python3
"""dispatch-prompt.py — UserPromptSubmit 唯一入口 dispatcher。

按 prompt 前缀分支（互斥）：
  /harness-apply <task>   验就绪：standard/refactor → readiness-review.md 结论 PASS；
                          quick → design.md 含 ## 就绪自评 且结论 PASS。缺 PASS → 阻断。
  /harness-apply（无名）   board/deliverables 推断唯一活跃任务；推断失败 → 阻断。
  /harness-propose ...    git status 扫源码脏改动 → 软提醒（additionalContext），永不阻断。
  其他 prompt             放行。

关键纪律：所有路径都必须打印合法 JSON 并 exit 0。紧急绕过：HARNESS_BYPASS=1。
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATHS = ('backend/', 'frontend/', 'mcp-server/', 'e2e/', 'package.json')


def allow(extra_context=None):
    if extra_context:
        print(json.dumps({
            'hookSpecificOutput': {
                'hookEventName': 'UserPromptSubmit',
                'additionalContext': extra_context,
            }
        }, ensure_ascii=False))
    else:
        print('{}')
    return 0


def block(reason):
    print(json.dumps({'decision': 'block', 'reason': reason}, ensure_ascii=False))
    return 0


def profile_of(task):
    p = ROOT / '.harness/deliverables' / task / 'proposal.md'
    if not p.exists():
        return None
    m = re.search(r'\*\*选择\*\*[:：]\s*(quick|standard|refactor)', p.read_text(encoding='utf-8'))
    return m.group(1) if m else None


def final_conclusion(path):
    if not path.exists():
        return None
    parts = re.split(r'^## 结论\s*$', path.read_text(encoding='utf-8'), flags=re.M)
    if len(parts) < 2:
        return None
    tail = parts[-1].strip()
    return 'PASS' if tail.startswith('PASS') else ('BLOCK' if tail.startswith('BLOCK') else None)


def infer_task():
    board = ROOT / '.harness/tasks/board.md'
    if board.exists():
        rows = re.findall(
            r'^\|\s*\d+\s*\|\s*([a-z0-9_-]+)\s*\|.*\|\s*(?:IN_PROGRESS|AWAITING_ARCHIVE)\s*\|',
            board.read_text(encoding='utf-8'), re.M)
        if len(rows) == 1:
            return rows[0]
    deliv = ROOT / '.harness/deliverables'
    active = [d.name for d in deliv.iterdir()
              if d.is_dir() and not d.name.startswith('_')] if deliv.is_dir() else []
    return active[0] if len(active) == 1 else None


def check_apply(args):
    task = args[0] if args and re.fullmatch(r'[a-z0-9][a-z0-9_-]*', args[0]) else infer_task()
    if not task:
        return block('/harness-apply 无法推断任务名：board.md 无唯一活跃行，deliverables 无唯一活跃目录。请显式指定 /harness-apply <任务名>。')

    task_dir = ROOT / '.harness/deliverables' / task
    if not task_dir.is_dir():
        return block(f'/harness-apply 前置不满足：任务目录不存在 {task_dir}')

    profile = profile_of(task) or 'standard'
    if profile == 'quick':
        design = task_dir / 'design.md'
        if not design.exists() or '## 就绪自评' not in design.read_text(encoding='utf-8'):
            return block(f'/harness-apply 前置不满足（quick）：design.md 缺失或无「## 就绪自评」段（任务 {task}）')
        if final_conclusion(design) != 'PASS':
            return block(f'/harness-apply 前置不满足（quick）：design.md 文末 ## 结论 非 PASS（任务 {task}）')
    else:
        rr = task_dir / 'readiness-review.md'
        if final_conclusion(rr) != 'PASS':
            return block(f'/harness-apply 前置不满足（{profile}）：readiness-review.md 缺失或文末 ## 结论 非 PASS（任务 {task}）')
    return allow(f'[hook] /harness-apply 就绪校验通过：task={task}, profile={profile}')


def check_propose():
    try:
        out = subprocess.run(['git', 'status', '--porcelain'], cwd=ROOT,
                             capture_output=True, text=True, timeout=15).stdout
    except Exception:
        return allow()
    dirty = [l for l in out.split('\n') if l.strip() and any(
        l[3:].startswith(p) or (' -> ' in l and p in l) for p in SOURCE_PATHS)]
    if dirty:
        return allow(
            '[hook] ⚠ 软提醒：工作区存在未提交的源码改动（' +
            '; '.join(d.strip() for d in dirty[:5]) +
            '）。propose 段禁止修改源码——请确认这些改动与本次 propose 无关，或先提交/贮藏。')
    return allow()


def main():
    try:
        if os.environ.get('HARNESS_BYPASS') == '1':
            return allow('[hook] HARNESS_BYPASS=1：跳过 harness 入口校验（事后必须补做被绕过的验证）')
        payload = json.load(sys.stdin)
        prompt = str(payload.get('prompt') or '').strip()
        if prompt.startswith('/harness-apply'):
            args = prompt.split()[1:]
            return check_apply(args)
        if prompt.startswith('/harness-propose'):
            return check_propose()
        return allow()
    except Exception:
        return allow()


if __name__ == '__main__':
    sys.exit(main())
