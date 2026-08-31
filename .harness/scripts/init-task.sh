#!/usr/bin/env bash
# init-task.sh — 任务初始化（/harness-propose 第一步）
# 四件事：①建任务目录 ②仅复制 proposal 模板（其余阶段文档由 stage-doc.sh 按需拉）
#        ③board.md 追加一行（状态 PENDING）④自动打基线快照
# 目录已存在 → 整体跳过进入修订模式（不补齐半成品目录）。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TASK="${1:-}"

if [ -z "$TASK" ]; then
  echo "用法: init-task.sh <任务名>（仅 a-z 0-9 - _）" >&2
  exit 2
fi
if ! echo "$TASK" | grep -qE '^[a-z0-9][a-z0-9_-]*$'; then
  echo "[FAIL] 任务名必须是 ASCII slug（仅 a-z 0-9 - _，不得以 _ 开头），收到: $TASK" >&2
  exit 1
fi

TASK_DIR="$ROOT/.harness/deliverables/$TASK"
if [ -d "$TASK_DIR" ]; then
  echo "[SKIP] 任务目录已存在，进入修订模式（不改动现有文件）: $TASK_DIR"
  exit 0
fi

mkdir -p "$TASK_DIR"
cp "$ROOT/.harness/templates/proposal.md" "$TASK_DIR/proposal.md"
echo "[PASS] 已创建 $TASK_DIR/proposal.md"

BOARD="$ROOT/.harness/tasks/board.md"
COUNT=$(grep -cE '^\| [0-9]+ ' "$BOARD" 2>/dev/null || true)
COUNT=${COUNT:-0}
NEXT_ID=$(printf '%03d' $((COUNT + 1)))
printf '| %s | %s | 需求澄清 | PENDING | 未定 | deliverables/%s/ | - |\n' "$NEXT_ID" "$TASK" "$TASK" >> "$BOARD"
echo "[PASS] board.md 已登记任务 ${NEXT_ID} ${TASK} (PENDING)"

bash "$ROOT/.harness/scripts/baseline.sh" snapshot
