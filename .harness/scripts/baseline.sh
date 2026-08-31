#!/usr/bin/env bash
# baseline.sh — 基线快照与回归对比
#   snapshot  运行 verify.sh 并把 FAIL/WARN 清单存入 .harness/baseline.json（任务启动时）
#   compare   重新运行 verify.sh，对比基线：出现【新增 FAIL】→ 退出码 1（阻塞交付）
# 增量视角：当前 PASS ≠ 没引入新 FAIL，必须与开工前状态对比。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASELINE="$ROOT/.harness/baseline.json"
cd "$ROOT"

collect() {
  # 输出当前 verify.sh 的 FAIL 项 id 列表（如 "A2 C1"），一行一个
  bash .harness/scripts/verify.sh 2>/dev/null | grep '^\[FAIL\]' | sed -E 's/^\[FAIL\] ([A-Z][0-9]+):.*/\1/' | sort -u
}

case "${1:-}" in
  snapshot)
    FAILS=$(collect)
    python3 - "$BASELINE" <<PYEOF
import json, sys
fails = """$FAILS""".split()
with open(sys.argv[1], 'w') as f:
    json.dump({"fails": fails}, f, indent=2)
print(f"[PASS] baseline snapshot 已写入（FAIL 项: {fails or '无'}）")
PYEOF
    ;;
  compare)
    if [ ! -f "$BASELINE" ]; then
      echo "[WARN] baseline.json 不存在，无法对比（先运行 baseline.sh snapshot）"
      exit 0
    fi
    CURRENT=$(collect)
    python3 - "$BASELINE" <<PYEOF
import json, sys
base = set(json.load(open(sys.argv[1]))["fails"])
cur = set("""$CURRENT""".split())
new = sorted(cur - base)
fixed = sorted(base - cur)
if fixed:
    print(f"[INFO] 已消除基线 FAIL: {' '.join(fixed)}")
if new:
    print(f"[FAIL] baseline compare 发现新增 FAIL 项: {' '.join(new)}")
    sys.exit(1)
print("[PASS] baseline compare: 无新增 FAIL")
PYEOF
    ;;
  *)
    echo "用法: baseline.sh <snapshot|compare>" >&2
    exit 2
    ;;
esac
