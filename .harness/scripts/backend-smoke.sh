#!/usr/bin/env bash
# backend-smoke.sh — 后端启动冒烟统一入口（verify.sh B3 / build-test Skill 调用）
# 四种结局：
#   监听成功            → exit 0 PASS
#   端口被占（环境问题） → exit 0 环境跳过
#   依赖服务不可达       → exit 0 环境跳过
#   代码崩溃（Syntax 等） → exit 1 FAIL
# 应急跳过：BACKEND_SMOKE_DISABLE=1
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [ "${BACKEND_SMOKE_DISABLE:-0}" = "1" ]; then
  echo "[SKIP] backend-smoke 已被 BACKEND_SMOKE_DISABLE=1 跳过"
  exit 0
fi

# 自动选空闲端口，避免与开发中的服务冲突
FREE_PORT=$(node -e 'const s=require("net").createServer();s.listen(0,()=>{console.log(s.address().port);s.close()})')
LOG=$(mktemp)

# timeout 自适应：timeout > gtimeout > 后台起 + 探活（macOS 默认无 timeout）
run_guarded() {
  if command -v timeout >/dev/null 2>&1; then
    PORT=$FREE_PORT timeout 8 node backend/server.js >"$LOG" 2>&1 &
  elif command -v gtimeout >/dev/null 2>&1; then
    PORT=$FREE_PORT gtimeout 8 node backend/server.js >"$LOG" 2>&1 &
  else
    PORT=$FREE_PORT node backend/server.js >"$LOG" 2>&1 &
  fi
  SERVER_PID=$!
}

run_guarded
sleep 2

STATUS=1
if grep -q "Server running" "$LOG"; then
  if curl -s "http://localhost:${FREE_PORT}/" >/dev/null 2>&1; then
    echo "[PASS] 后端启动成功且根路径可访问 (port ${FREE_PORT})"
    STATUS=0
  else
    echo "[FAIL] 后端已启动但根路径不可访问"
    STATUS=1
  fi
elif grep -qE "EADDRINUSE" "$LOG"; then
  echo "[SKIP] 端口被占用（环境问题，不判代码失败）"
  STATUS=0
elif grep -qE "ECONNREFUSED|ServerSelection" "$LOG"; then
  echo "[SKIP] 依赖服务不可达（环境问题，不判代码失败）"
  STATUS=0
else
  echo "[FAIL] 后端启动失败（疑似代码崩溃）"
  echo "--- 启动日志尾部 ---"
  tail -20 "$LOG"
  STATUS=1
fi

kill "$SERVER_PID" >/dev/null 2>&1
wait "$SERVER_PID" 2>/dev/null
rm -f "$LOG"
exit $STATUS
