#!/usr/bin/env python3
"""check-e2e-evidence.py — E2E 证据引用完整性校验

子命令：
  runtime <task> [--require-refs]   TE 收工时（tester hook 调用）：
                                     报告引用的证据必须真实存在；
                                     --require-refs 时证据目录内每个文件也必须被报告引用
  audit <task> [--duplicates-as-warn]
                                     verify.sh B4：runtime 检查 + md5 重复检测
  archived <task>                    归档后校验（证据目录换成 _archive/<task>/evidence/）
  rewrite-archived <task>            归档时把报告中 .playwright-cli/_tasks/<task>/ 前缀
                                     改写为 evidence/

退出码：0 = 引用闭环；非 0 = 有悬空引用 / 报告缺证据引用 / 重复证据（audit 未降级时）。
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE_EXTS = {'.png', '.yml', '.yaml', '.txt'}


def report_path(task, archived=False):
    if archived:
        return ROOT / '.harness/deliverables/_archive' / task / 'test-report.md'
    return ROOT / '.harness/deliverables' / task / 'test-report.md'


def evidence_dir(task, archived=False):
    if archived:
        return ROOT / '.harness/deliverables/_archive' / task / 'evidence'
    return ROOT / '.playwright-cli/_tasks' / task


def referenced_basenames(report_text):
    """报告中引用的证据文件名（按扩展名识别）。"""
    pat = re.compile(r'[A-Za-z0-9_\-.]+\.(?:png|yml|yaml|txt)\b')
    return set(m.group(0) for m in pat.finditer(report_text))


def check(task, archived=False, require_refs=False, duplicates_as_warn=None):
    rp = report_path(task, archived)
    if not rp.exists():
        print(f'[FAIL] 测试报告不存在: {rp}')
        return 1
    text = rp.read_text(encoding='utf-8')
    refs = referenced_basenames(text)

    ed = evidence_dir(task, archived)
    files = {f.name for f in ed.iterdir() if f.suffix in EVIDENCE_EXTS} if ed.is_dir() else set()

    rc = 0
    dangling = sorted(r for r in refs if r not in files)
    if dangling:
        print(f'[FAIL] 报告引用了不存在的证据: {" ".join(dangling)}')
        rc = 1

    if require_refs:
        unreferenced = sorted(files - refs)
        if unreferenced:
            print(f'[FAIL] 证据目录存在未被报告引用的文件: {" ".join(unreferenced)}')
            rc = 1

    if not refs and files:
        print('[FAIL] 报告未引用任何证据，但证据目录非空')
        rc = 1

    if require_refs and not refs and not files:
        print('[FAIL] 报告未引用任何证据且证据目录为空（B 类每条用例至少 1 张截图）')
        rc = 1

    if duplicates_as_warn is not None and ed.is_dir():
        seen = {}
        for f in sorted(ed.iterdir()):
            if f.suffix not in EVIDENCE_EXTS:
                continue
            digest = hashlib.md5(f.read_bytes()).hexdigest()
            if digest in seen:
                level = 'WARN' if duplicates_as_warn else 'FAIL'
                print(f'[{level}] 证据内容重复: {seen[digest]} == {f.name}')
                if not duplicates_as_warn:
                    rc = 1
            else:
                seen[digest] = f.name

    if rc == 0:
        print(f'[PASS] E2E 证据引用闭环（引用 {len(refs)} 项 / 实物 {len(files)} 项）')
    return rc


def rewrite_archived(task):
    rp = report_path(task, archived=True)
    if not rp.exists():
        print(f'[FAIL] 归档报告不存在: {rp}')
        return 1
    text = rp.read_text(encoding='utf-8')
    new = text.replace(f'.playwright-cli/_tasks/{task}/', 'evidence/')
    rp.write_text(new, encoding='utf-8')
    print(f'[PASS] 已改写证据路径前缀 → evidence/（{rp}）')
    return 0


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    cmd, task = argv[1], argv[2]
    flags = set(argv[3:])
    if cmd == 'runtime':
        return check(task, require_refs='--require-refs' in flags)
    if cmd == 'audit':
        return check(task, require_refs=True,
                     duplicates_as_warn='--duplicates-as-warn' in flags)
    if cmd == 'archived':
        return check(task, archived=True, require_refs=True)
    if cmd == 'rewrite-archived':
        return rewrite_archived(task)
    print(f'[FAIL] 未知子命令: {cmd}')
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
