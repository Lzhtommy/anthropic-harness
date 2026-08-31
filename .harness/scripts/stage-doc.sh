#!/usr/bin/env bash
# stage-doc.sh — 阶段文档按需拉取（PM 在拉起对应 Worker Task 前调用）
# 用法: stage-doc.sh <任务名> <阶段>
# <阶段> 与 transitions.json 的 documents 键严格一致：
#   requirements | design | readiness | development | review | testing | impact-analysis
# 幂等：目标文档已存在则保留现有内容（输出"已存在"），不覆盖。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TASK="${1:-}"
STAGE="${2:-}"

if [ -z "$TASK" ] || [ -z "$STAGE" ]; then
  echo "用法: stage-doc.sh <任务名> <阶段>" >&2
  exit 2
fi

TASK_DIR="$ROOT/.harness/deliverables/$TASK"
if [ ! -d "$TASK_DIR" ]; then
  echo "[FAIL] 任务目录不存在: $TASK_DIR（先运行 init-task.sh）" >&2
  exit 1
fi

case "$STAGE" in
  requirements)    DOC="requirements.md" ;;
  design)          DOC="design.md" ;;
  readiness)       DOC="readiness-review.md" ;;
  development)     DOC="dev-log.md" ;;
  review)          DOC="code-review.md" ;;
  testing)         DOC="test-report.md" ;;
  impact-analysis) DOC="impact-analysis.md" ;;
  *)
    echo "[FAIL] 未知阶段: $STAGE" >&2
    exit 1
    ;;
esac

TEMPLATE="$ROOT/.harness/deliverables/_template/$DOC"
TARGET="$TASK_DIR/$DOC"

if [ -f "$TARGET" ]; then
  echo "已存在（保留现有内容）: $TARGET"
  exit 0
fi
cp "$TEMPLATE" "$TARGET"
echo "已生成: $TARGET"
