#!/usr/bin/env python3
"""_actions_developer.py — Developer 收工后的旁路验证（failClosed=false）。

独立进程重跑 `npm run test:all` + `verify.sh`，结果写
.harness/.hook-results/<task>--developer.json。Agent 自述不作数，PM 只认本结果文件。
"""
import re
import subprocess
from pathlib import Path

from _subagent_payload import ROOT, write_result


def _run(cmd, timeout):
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                           timeout=timeout, shell=isinstance(cmd, str))
        return p.returncode, (p.stdout or '') + (p.stderr or '')
    except subprocess.TimeoutExpired:
        return 124, f'TIMEOUT: {cmd}'
    except Exception as e:  # noqa: BLE001
        return 1, f'HOOK-ERROR: {e}'


def _parse_vitest(output):
    """汇总 vitest 输出的 passed/failed 计数（后端 + 前端两段）。"""
    passed = sum(int(n) for n in re.findall(r'Tests\s+(\d+) passed', output))
    failed = sum(int(n) for n in re.findall(r'(\d+) failed', output))
    return passed, failed


def run(task):
    test_rc, test_out = _run('npm run test:all', timeout=300)
    passed, failed = _parse_vitest(test_out)

    verify_rc, verify_out = _run(['bash', '.harness/scripts/verify.sh'], timeout=300)

    ok = test_rc == 0 and passed > 0 and failed == 0 and verify_rc == 0
    fail_reason = None
    if not ok:
        if test_rc != 0 or failed > 0 or passed == 0:
            fail_reason = f'npm run test:all 未通过（passed={passed}, failed={failed}, rc={test_rc}）'
        else:
            fails = [l for l in verify_out.split('\n') if l.startswith('[FAIL]')]
            fail_reason = 'verify.sh FAIL: ' + '; '.join(fails[:3])

    return write_result(task, 'developer', {
        'verdict': 'PASS' if ok else 'FAIL',
        'summary': f'hook 旁路验证：test:all passed={passed} failed={failed}；verify.sh rc={verify_rc}',
        'fail_reason': fail_reason,
        'test_passed': passed,
        'test_failed': failed,
        'verify_rc': verify_rc,
    })
