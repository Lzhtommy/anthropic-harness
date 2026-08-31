#!/usr/bin/env python3
"""_subagent_payload.py — hook 共享模块：解析 stdin payload、识别 Worker 身份与任务名。

身份识别三步策略（课程约定）：
  ① payload 字段（agent_type / subagent_type / agent_name）
  ② 扫 transcript 中的 agent 契约路径锚（.harness/agents/<role>.md）与 TASK_NAME=
  ③ 都拿不到 → 返回 None（调用方静默退出）
"""
import json
import re
import sys
from pathlib import Path

ROLES = [
    'business-analyst', 'solution-architect', 'readiness-reviewer',
    'developer', 'code-reviewer', 'test-engineer',
]

ROOT = Path(__file__).resolve().parents[2]


def read_payload():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def _scan_text_for_role(text):
    """取 transcript 中最后出现的角色锚。"""
    last_role, last_pos = None, -1
    for role in ROLES:
        for pat in (f'.harness/agents/{role}.md', f'"subagent_type":"{role}"',
                    f'"subagent_type": "{role}"'):
            pos = text.rfind(pat)
            if pos > last_pos:
                last_pos, last_role = pos, role
    return last_role


def _scan_text_for_task(text):
    hits = re.findall(r'TASK_NAME=([a-z0-9][a-z0-9_-]*)', text)
    return hits[-1] if hits else None


def identify(payload):
    """返回 (role, task_name)，识别失败对应位置为 None。"""
    role = None
    for key in ('agent_type', 'subagent_type', 'agent_name'):
        val = str(payload.get(key) or '')
        if val in ROLES:
            role = val
            break

    task = None
    text = ''
    for key in ('agent_transcript_path', 'transcript_path'):
        p = payload.get(key)
        if p and Path(p).exists():
            try:
                # 只读尾部 512KB，足够覆盖本次 subagent 会话
                raw = Path(p).read_bytes()
                text += raw[-524288:].decode('utf-8', errors='replace')
            except Exception:
                pass

    if not role and text:
        role = _scan_text_for_role(text)
    if text:
        task = _scan_text_for_task(text)

    if not task:
        task = _board_unique_active()
    return role, task


def _board_unique_active():
    """兜底：board.md 唯一 IN_PROGRESS/PENDING 行的任务名。"""
    board = ROOT / '.harness/tasks/board.md'
    if not board.exists():
        return None
    active = re.findall(
        r'^\|\s*\d+\s*\|\s*([a-z0-9_-]+)\s*\|.*\|\s*(?:IN_PROGRESS|PENDING)\s*\|',
        board.read_text(encoding='utf-8'), re.M)
    return active[0] if len(active) == 1 else None


def write_result(task, role, data):
    out_dir = ROOT / '.harness/.hook-results'
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f'{task}--{role}.json'
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    return path


def audit_log(entry):
    log_dir = ROOT / '.harness/.hook-logs'
    log_dir.mkdir(parents=True, exist_ok=True)
    with open(log_dir / 'dispatch-subagent.jsonl', 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
