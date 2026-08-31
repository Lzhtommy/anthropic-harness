#!/usr/bin/env bash
# codebase-guide-init.sh — 首次生成 codebase-guide 骨架（技术栈无关）
# 两段式设计：本脚本只扫「通用事实」落盘 .reports/codebase-guide-init-facts.txt，
# 并从 .harness/templates/codebase-guide-skeletons/*.tpl 渲染 6 份含 <!-- TODO --> 的
# 骨架；语义填充由主会话 AI（/codebase-guide-init 命令）完成。
# 用法：
#   codebase-guide-init.sh            # 默认：目标目录必须为空
#   codebase-guide-init.sh --force    # 强制覆盖 6 份骨架（危险：替换已有语义不合并）
#   codebase-guide-init.sh --dry-run  # 仅预演，不写入
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUIDE_DIR="$ROOT/.harness/codebase-guide"
TPL_DIR="$ROOT/.harness/templates/codebase-guide-skeletons"
REPORT_DIR="$ROOT/.reports"
FACTS="$REPORT_DIR/codebase-guide-init-facts.txt"
MODE="${1:-}"

FILES="index overview backend-arch frontend-arch deps dev-recipes"

if [ "$MODE" != "--force" ] && [ "$MODE" != "--dry-run" ] && [ -d "$GUIDE_DIR" ] && [ -n "$(ls -A "$GUIDE_DIR" 2>/dev/null)" ]; then
  echo "[FAIL] $GUIDE_DIR 非空。重建请先备份（git mv ... .bak）再跑，或用 --force 覆盖。" >&2
  exit 1
fi

# ── 收集通用事实（不假设技术栈） ──
collect_facts() {
  echo "=== codebase-guide-init facts ==="
  echo "date: $(date '+%Y-%m-%d %H:%M')"
  echo "project: $(basename "$ROOT")"
  echo "git_sha: $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo 'no-commit')"
  echo ""
  echo "--- 一级目录 ---"
  find "$ROOT" -maxdepth 1 -type d -not -name '.*' -not -name node_modules | sed "s|$ROOT/||" | grep -v "^$ROOT$" | sort
  echo ""
  echo "--- 清单文件 ---"
  for f in package.json frontend/package.json mcp-server/package.json requirements.txt go.mod Cargo.toml pom.xml Gemfile composer.json; do
    [ -f "$ROOT/$f" ] && { echo "### $f"; head -40 "$ROOT/$f"; echo ""; }
  done
}

if [ "$MODE" = "--dry-run" ]; then
  echo "[DRY-RUN] 将写入: $FACTS"
  for name in $FILES; do echo "[DRY-RUN] 将渲染: $GUIDE_DIR/$name.md（源 $TPL_DIR/$name.tpl）"; done
  exit 0
fi

mkdir -p "$REPORT_DIR" "$GUIDE_DIR"
collect_facts > "$FACTS"
echo "[PASS] 事实清单已写入 $FACTS"

for name in $FILES; do
  if [ ! -f "$TPL_DIR/$name.tpl" ]; then
    echo "[FAIL] 缺少骨架模板: $TPL_DIR/$name.tpl" >&2
    exit 1
  fi
  cp "$TPL_DIR/$name.tpl" "$GUIDE_DIR/$name.md"
  echo "[PASS] 已渲染骨架: $GUIDE_DIR/$name.md"
done

echo ""
echo "下一步（由 AI 完成）：读 $FACTS → 探测项目拓扑 → 按各文件 <!-- TODO --> 填语义 → 质量标尺自检 → 机器校验。"
