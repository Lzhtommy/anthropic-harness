#!/usr/bin/env python3
"""spec-lint.py — Spec 编号体系只读诊断 / 门禁

校验层级：
  L1 需求结构：Requirement 名文件内唯一；每 Requirement ≥1 Scenario；正文含 SHALL（缺→WARN）
  L2 编号体系：每条 Requirement/Scenario 带 <前缀>-R/S-NNN 码；前缀与 frontmatter 一致；
              全局唯一；编号 ≤ id_max（只增不复用的上界）；不得复用 retired 码
  L3 _index 引用：索引里的域文件必须存在（悬空→WARN）
  L4 _archive delta：归档 delta 指向的目标 spec 不在当前 specs（→INFO）
  L7 TBD 残留：归档后 specs/ 不得残留 FLOW-TBD / CSTR-TBD（→ERROR）

分级：ERROR → 退出码 1 阻断；WARN / INFO 不阻断。
用法：python3 spec-lint.py [--json]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPECS = ROOT / '.harness' / 'specs'

REQ_RE = re.compile(r'^### Requirement:\s*(.+?)\s*\(([A-Z0-9]+)-R-(\d+)\)\s*$')
SCN_RE = re.compile(r'^#### Scenario:\s*(.+?)\s*\(([A-Z0-9]+)-S-(\d+)\)\s*$')
REQ_NOCODE_RE = re.compile(r'^### Requirement:')
SCN_NOCODE_RE = re.compile(r'^#### Scenario:')


def parse_frontmatter(text):
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).split('\n'):
        kv = re.match(r'^(\w+):\s*(.*)$', line)
        if kv:
            key, val = kv.group(1), kv.group(2).strip()
            if val.startswith('['):
                fm[key] = [x.strip().strip('"\'') for x in val.strip('[]').split(',') if x.strip()]
            else:
                fm[key] = val.strip('"\'')
    return fm


def lint():
    issues = []  # (level, code, message)
    add = lambda lvl, code, msg: issues.append({'level': lvl, 'check': code, 'message': msg})

    if not SPECS.is_dir():
        add('ERROR', 'L0', f'specs 目录不存在: {SPECS}')
        return issues

    global_codes = {}  # code -> file

    domain_files = sorted(
        f for f in SPECS.glob('*.md') if not f.name.startswith('_')
    )
    for f in domain_files:
        text = f.read_text(encoding='utf-8')
        fm = parse_frontmatter(f.read_text(encoding='utf-8'))
        prefix = fm.get('prefix', '')
        retired = set(fm.get('retired', []) if isinstance(fm.get('retired'), list) else [])
        id_max_r = int(fm.get('id_max_r', 0) or 0)
        id_max_s = int(fm.get('id_max_s', 0) or 0)

        if not prefix:
            add('ERROR', 'L2', f'{f.name}: frontmatter 缺少 prefix')
            continue

        req_names, cur_req, scn_count = {}, None, {}
        for i, line in enumerate(text.split('\n'), 1):
            rm, sm = REQ_RE.match(line), SCN_RE.match(line)
            if rm:
                name, p, num = rm.group(1), rm.group(2), int(rm.group(3))
                code = f'{p}-R-{rm.group(3)}'
                if name in req_names:
                    add('ERROR', 'L1', f'{f.name}:{i} Requirement 名重复: {name}')
                req_names[name] = i
                cur_req = code
                scn_count[code] = 0
                if p != prefix:
                    add('ERROR', 'L2', f'{f.name}:{i} 码前缀 {p} 与 frontmatter prefix {prefix} 不符')
                if code in global_codes:
                    add('ERROR', 'L2', f'{f.name}:{i} 码 {code} 与 {global_codes[code]} 重复')
                global_codes[code] = f.name
                if num > id_max_r:
                    add('ERROR', 'L2', f'{f.name}:{i} {code} 超出 id_max_r={id_max_r}（新增码须同步上调 id_max）')
                if code in retired:
                    add('ERROR', 'L2', f'{f.name}:{i} 复用了退役码 {code}')
            elif sm:
                p, num = sm.group(2), int(sm.group(3))
                code = f'{p}-S-{sm.group(3)}'
                if cur_req:
                    scn_count[cur_req] += 1
                if p != prefix:
                    add('ERROR', 'L2', f'{f.name}:{i} 码前缀 {p} 与 frontmatter prefix {prefix} 不符')
                if code in global_codes:
                    add('ERROR', 'L2', f'{f.name}:{i} 码 {code} 与 {global_codes[code]} 重复')
                global_codes[code] = f.name
                if num > id_max_s:
                    add('ERROR', 'L2', f'{f.name}:{i} {code} 超出 id_max_s={id_max_s}（新增码须同步上调 id_max）')
                if code in retired:
                    add('ERROR', 'L2', f'{f.name}:{i} 复用了退役码 {code}')
            elif REQ_NOCODE_RE.match(line):
                add('ERROR', 'L2', f'{f.name}:{i} Requirement 缺少编号码（格式 (PREFIX-R-NNN)）')
            elif SCN_NOCODE_RE.match(line):
                add('ERROR', 'L2', f'{f.name}:{i} Scenario 缺少编号码（格式 (PREFIX-S-NNN)）')

        for code, n in scn_count.items():
            if n == 0:
                add('ERROR', 'L1', f'{f.name}: {code} 没有任何 Scenario')

        # SHALL 检查：每个 Requirement 块正文应含 SHALL
        blocks = re.split(r'^### Requirement:', text, flags=re.M)[1:]
        for b in blocks:
            head = b.split('\n')[0].strip()
            body = b.split('#### Scenario:')[0]
            if 'SHALL' not in body and 'MUST' not in body:
                add('WARN', 'L1', f'{f.name}: Requirement「{head}」正文缺少 SHALL/MUST 强度词')

        # L7 TBD 残留
        for i, line in enumerate(text.split('\n'), 1):
            if 'FLOW-TBD' in line or 'CSTR-TBD' in line:
                add('ERROR', 'L7', f'{f.name}:{i} 归档后 specs 残留 TBD 占位码')

    # L3 _index 引用
    index = SPECS / '_index.md'
    if index.exists():
        # 只扫描表格行里反引号引用的 spec 文件（如 `products.md`）
        for line in index.read_text(encoding='utf-8').split('\n'):
            if not line.startswith('|'):
                continue
            for m in re.finditer(r'`([a-z0-9_-]+\.md)`', line):
                name = m.group(1)
                if name.startswith('_'):
                    continue
                if not (SPECS / name).exists():
                    add('WARN', 'L3', f'_index.md 引用了不存在的 spec 文件: {name}')
    else:
        add('WARN', 'L3', '_index.md 不存在')

    # L4 归档 delta 目标存在性
    archive = SPECS / '_archive'
    if archive.is_dir():
        for f in archive.rglob('*.md'):
            for m in re.finditer(r'specs/([a-z0-9_-]+\.md)', f.read_text(encoding='utf-8')):
                if not (SPECS / m.group(1)).exists():
                    add('INFO', 'L4', f'{f.relative_to(ROOT)}: delta 目标 {m.group(1)} 不在当前 specs')

    return issues


def main():
    issues = lint()
    as_json = '--json' in sys.argv
    errors = [i for i in issues if i['level'] == 'ERROR']
    if as_json:
        print(json.dumps({'issues': issues, 'errors': len(errors)}, ensure_ascii=False, indent=2))
    else:
        for i in issues:
            icon = {'ERROR': '🔴', 'WARN': '🟡', 'INFO': '🔵'}[i['level']]
            print(f"{icon} [{i['level']}] {i['check']}: {i['message']}")
        if not issues:
            print('✅ spec-lint: 全部通过（0 issue）')
        else:
            print(f"—— 汇总: {len(errors)} ERROR / "
                  f"{sum(1 for i in issues if i['level'] == 'WARN')} WARN / "
                  f"{sum(1 for i in issues if i['level'] == 'INFO')} INFO")
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
