#!/usr/bin/env bash
# build-stamp.sh — 前端构建指纹缓存
# 基于 frontend/src、frontend/index.html、frontend/package.json、根 package.json
# 的内容哈希生成 frontend/dist/.stamp；verify.sh B1 命中 stamp 且 dist/index.html
# 存在时直接 PASS（命中耗时 ~60ms）。
# 用法：build-stamp.sh <path|hash|check|write|invalidate>
# 逃生阀：BUILD_STAMP_DISABLE=1 视为永不命中；VERIFY_FORCE_BUILD=1 由 verify.sh 消费。
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP_FILE="$ROOT/frontend/dist/.stamp"

compute_hash() {
  {
    find "$ROOT/frontend/src" -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 2>/dev/null | sort -z | xargs -0 cat 2>/dev/null
    cat "$ROOT/frontend/index.html" 2>/dev/null
    cat "$ROOT/frontend/package.json" 2>/dev/null
    cat "$ROOT/package.json" 2>/dev/null
  } | shasum -a 256 | cut -d' ' -f1
}

case "${1:-}" in
  path)
    echo "$STAMP_FILE"
    ;;
  hash)
    compute_hash
    ;;
  check)
    [ "${BUILD_STAMP_DISABLE:-0}" = "1" ] && exit 1
    [ -f "$STAMP_FILE" ] || exit 1
    [ -f "$ROOT/frontend/dist/index.html" ] || exit 1
    [ "$(cat "$STAMP_FILE")" = "$(compute_hash)" ] || exit 1
    exit 0
    ;;
  write)
    mkdir -p "$ROOT/frontend/dist"
    compute_hash > "$STAMP_FILE"
    ;;
  invalidate)
    rm -f "$STAMP_FILE"
    ;;
  *)
    echo "用法: build-stamp.sh <path|hash|check|write|invalidate>" >&2
    exit 2
    ;;
esac
