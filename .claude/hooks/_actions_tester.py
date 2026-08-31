#!/usr/bin/env python3
"""_actions_tester.py — Test Engineer 收工后的旁路验证（failClosed=false）。

顺序：①读 test-report.md 最终 `## 结论` 是否 PASS（非 PASS 直接阻断，不再往下跑）
     ②check-e2e-evidence.py 校验测试证据闭环
     ③verify.sh
     ④baseline.sh compare
结果写 .harness/.hook-results/<task>--test-engineer.json。
FAIL 时结果文件写明「不得自行进入 AWAITING_ARCHIVE」。
"""
import re
import subprocess
from pathlib import Path

from _subagent_payload import ROOT, write_result


def _run(cmd, timeout=300):
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout or '') + (p.stderr or '')
    except subprocess.TimeoutExpired:
        return 124, f'TIMEOUT: {cmd}'
    except Exception as e:  # noqa: BLE001
        return 1, f'HOOK-ERROR: {e}'


def _report_conclusion(task):
    rp = ROOT / '.harness/deliverables' / task / 'test-report.md'
    if not rp.exists():
        return None
    text = rp.read_text(encoding='utf-8')
    sections = re.split(r'^## 结论\s*$', text, flags=re.M)
    if len(sections) < 2:
        return None
    tail = sections[-1].strip().split('\n')[0].strip()
    if tail.startswith('PASS / FAIL'):
        return None  # 模板残留，不是真实结论
    if tail.startswith('PASS'):
        return 'PASS'
    if tail.startswith('FAIL'):
        return 'FAIL'
    return None


def run(task):
    conclusion = _report_conclusion(task)
    if conclusion != 'PASS':
        return write_result(task, 'test-engineer', {
            'verdict': 'FAIL',
            'summary': f'test-report.md 最终结论为 {conclusion or "缺失/不合法"}，旁路验证未执行',
            'fail_reason': 'test-report 结论非 PASS；不得自行进入 AWAITING_ARCHIVE',
            'verify_rc': None,
            'baseline_rc': None,
        })

    ev_rc, ev_out = _run(['python3', '.harness/scripts/check-e2e-evidence.py', 'runtime', task, '--require-refs'])
    verify_rc, _ = _run(['bash', '.harness/scripts/verify.sh'])
    baseline_rc, baseline_out = _run(['bash', '.harness/scripts/baseline.sh', 'compare'])

    ok = ev_rc == 0 and verify_rc == 0 and baseline_rc == 0
    fail_reason = None
    if not ok:
        parts = []
        if ev_rc != 0:
            parts.append('E2E 证据闭环校验失败: ' + ev_out.strip().split('\n')[0])
        if verify_rc != 0:
            parts.append(f'verify.sh rc={verify_rc}')
        if baseline_rc != 0:
            parts.append('baseline compare 出现新增 FAIL: ' + baseline_out.strip().split('\n')[-1])
        fail_reason = '；'.join(parts) + '；不得自行进入 AWAITING_ARCHIVE'

    return write_result(task, 'test-engineer', {
        'verdict': 'PASS' if ok else 'FAIL',
        'summary': f'hook 旁路验证：evidence rc={ev_rc}；verify rc={verify_rc}；baseline rc={baseline_rc}',
        'fail_reason': fail_reason,
        'verify_rc': verify_rc,
        'baseline_rc': baseline_rc,
    })
