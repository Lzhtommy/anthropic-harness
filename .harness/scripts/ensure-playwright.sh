#!/usr/bin/env bash
# ensure-playwright.sh — Playwright Chromium 按需安装（命中缓存 ~40ms 返回）
# 读 node_modules/playwright-core/browsers.json 得 chromium revision，
# 对比本机缓存目录，命中立即返回，未命中才 npx playwright install chromium。
# PLAYWRIGHT_PRUNE_CACHE=1 时先清理未使用的旧版本浏览器。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BROWSERS_JSON="node_modules/playwright-core/browsers.json"
if [ ! -f "$BROWSERS_JSON" ]; then
  echo "[FAIL] 未找到 playwright-core（先 npm install）" >&2
  exit 1
fi

REV=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$BROWSERS_JSON','utf8')).browsers.find(b=>b.name==='chromium').revision)")

case "$(uname)" in
  Darwin) CACHE_DIR="$HOME/Library/Caches/ms-playwright" ;;
  *)      CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/ms-playwright" ;;
esac

if [ "${PLAYWRIGHT_PRUNE_CACHE:-0}" = "1" ]; then
  npx playwright uninstall --all >/dev/null 2>&1 || true
fi

if [ -d "$CACHE_DIR/chromium-$REV" ]; then
  echo "[PASS] chromium-$REV 已就绪（缓存命中）"
  exit 0
fi

echo "[INFO] chromium-$REV 未安装，开始下载..."
npx playwright install chromium
echo "[PASS] chromium-$REV 安装完成"
