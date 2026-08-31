#!/usr/bin/env python3
"""dispatch-subagent.py — SubagentStop 唯一入口 dispatcher。

按身份分发（互斥，单次收工最多触发一条）：
  developer     → _actions_developer.run(task)   独立重跑 test:all + verify.sh
  test-engineer → _actions_tester.run(task)      结论/证据/verify/baseline 四连校验
  BA/SA/RR/CR   → 仅写审计日志 .harness/.hook-logs/dispatch-subagent.jsonl
  未识别身份     → 静默退出

failClosed=false：本 hook 只写结果文件，从不阻断 subagent 停止（永远输出合法 JSON 并 exit 0）。
紧急绕过：HARNESS_BYPASS=1。
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _subagent_payload import audit_log, identify, read_payload  # noqa: E402


def main():
    try:
        if os.environ.get('HARNESS_BYPASS') == '1':
            print('{}')
            return 0

        payload = read_payload()
        role, task = identify(payload)

        entry = {
            'ts': datetime.now(timezone.utc).isoformat(),
            'event': 'SubagentStop',
            'role': role,
            'task': task,
        }

        if role is None:
            print('{}')
            return 0

        if role == 'developer' and task:
            import _actions_developer
            path = _actions_developer.run(task)
            entry['result_file'] = str(path)
        elif role == 'test-engineer' and task:
            import _actions_tester
            path = _actions_tester.run(task)
            entry['result_file'] = str(path)
        # BA / SA / RR / CR：不触发验证，仅审计

        audit_log(entry)
        print('{}')
        return 0
    except Exception as e:  # noqa: BLE001 — 任何异常都不得阻断
        try:
            audit_log({'event': 'SubagentStop', 'error': str(e)})
        except Exception:
            pass
        print('{}')
        return 0


if __name__ == '__main__':
    sys.exit(main())
