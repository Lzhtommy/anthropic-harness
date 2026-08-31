#!/usr/bin/env bash
# verify.sh — 交付硬校验总入口（第 4 层防线）
# A 类静态规范 8 项 / B 类交付门槛 4 项 / C 类工程一致性 7 项，共 19 检查点。
# 判定：任一 FAIL → 退出码 1（不可交付）；WARN 不阻塞。
# 环境变量：
#   VERIFY_SKIP_CODEBASE_GUIDE=1  跳过 C7（须在 dev-log 说明理由）
#   VERIFY_FORCE_BUILD=1          B1 忽略 build-stamp 缓存强制重建
#   VERIFY_TASK=<任务名>          B4 E2E 证据审计生效
set -u

# ── project config ──（移植到其他项目时改这里）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
CONTROLLERS_DIR="$BACKEND_DIR/controllers"
ROUTES_DIR="$BACKEND_DIR/routes"
MODELS_DIR="$BACKEND_DIR/models"
APP_ENTRY="$BACKEND_DIR/app.js"
FRONTEND_ROUTER="$FRONTEND_DIR/src/main.jsx"
FRONTEND_SCREENS_DIR="$FRONTEND_DIR/src/screens"
FRONTEND_API_DIR="$FRONTEND_DIR/src/api"
PORT_WHITELIST="$BACKEND_DIR/config.js"          # 唯一允许出现端口默认值的文件
CONSOLE_WHITELIST="server.js|seeder.js"           # 允许 console.log 的后端文件
MAX_FILE_LINES=300
# 架构面路径（触及则 C7 要求同步 codebase-guide）
ARCH_FACE_REGEX='^(backend/(routes|controllers|models|middleware)/|backend/app\.js|frontend/src/(main\.jsx|api/))'
GUIDE_DIR=".harness/codebase-guide"
# ── end project config ──

cd "$ROOT"
PASS=0; WARN=0; FAILED=0
pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
warn() { echo "[WARN] $1"; WARN=$((WARN+1)); }
fail() { echo "[FAIL] $1"; FAILED=$((FAILED+1)); }

echo "=== verify.sh — A 类静态规范 ==="

# A1 后端全 ES Modules（无 require）
HITS=$(grep -rnE '(^|[^.a-zA-Z])require\(' "$BACKEND_DIR" --include='*.js' 2>/dev/null || true)
if [ -z "$HITS" ]; then pass "A1: 后端全 ES Modules（无 require）"
else fail "A1: 后端存在 CommonJS require: $(echo "$HITS" | head -3 | tr '\n' ' ')"; fi

# A2 所有 Controller 导出必须 asyncHandler 包裹
A2_BAD=""
for f in "$CONTROLLERS_DIR"/*.js; do
  [ -e "$f" ] || continue
  BAD=$(grep -nE '^export (const|function) ' "$f" | grep -v 'asyncHandler(' || true)
  [ -n "$BAD" ] && A2_BAD="$A2_BAD $f:$(echo "$BAD" | head -1 | cut -d: -f1)"
done
if [ -z "$A2_BAD" ]; then pass "A2: 所有 Controller 导出均由 asyncHandler 包裹"
else fail "A2: Controller 未用 asyncHandler 包裹:$A2_BAD"; fi

# A3 Model 层不得绕过存储层直接操作 fs
HITS=$(grep -rln "from 'fs'" "$MODELS_DIR" 2>/dev/null || true)
if [ -z "$HITS" ]; then pass "A3: Model 层统一经由 db/store.js 持久化"
else fail "A3: Model 直接 import fs 绕过存储层: $HITS"; fi

# A4 无残留 console.log（白名单除外）
HITS=$(grep -rn 'console\.log' "$BACKEND_DIR" --include='*.js' 2>/dev/null | grep -vE "$CONSOLE_WHITELIST" | grep -v '__tests__' || true)
if [ -z "$HITS" ]; then pass "A4: 无残留 console.log"
else warn "A4: 残留 console.log: $(echo "$HITS" | head -3 | cut -d: -f1-2 | tr '\n' ' ')"; fi

# A5 单文件 ≤ MAX_FILE_LINES 行
HITS=$(find "$BACKEND_DIR" "$FRONTEND_DIR/src" -type f \( -name '*.js' -o -name '*.jsx' \) -not -path '*/node_modules/*' -not -path '*__tests__*' 2>/dev/null \
  | while read -r f; do L=$(wc -l <"$f"); [ "$L" -gt "$MAX_FILE_LINES" ] && echo "$f($L)"; done)
if [ -z "$HITS" ]; then pass "A5: 单文件行数均 ≤ ${MAX_FILE_LINES}"
else warn "A5: 超长文件: $HITS"; fi

# A6 每个路由文件有对应 Controller
A6_BAD=""
for f in "$ROUTES_DIR"/*Routes.js; do
  [ -e "$f" ] || continue
  BASE=$(basename "$f" Routes.js)
  [ -f "$CONTROLLERS_DIR/${BASE}Controller.js" ] || A6_BAD="$A6_BAD $BASE"
done
if [ -z "$A6_BAD" ]; then pass "A6: 每个路由文件均有对应 Controller"
else fail "A6: 路由缺少对应 Controller:$A6_BAD"; fi

# A7 含写操作的路由文件必须引入 protect
A7_BAD=""
for f in "$ROUTES_DIR"/*.js; do
  [ -e "$f" ] || continue
  if grep -qE '\.(post|put|delete)\(' "$f" && ! grep -q 'protect' "$f"; then
    A7_BAD="$A7_BAD $(basename "$f")"
  fi
done
if [ -z "$A7_BAD" ]; then pass "A7: 写操作路由均引入 protect"
else warn "A7: 写操作路由未引入 protect:$A7_BAD"; fi

# A8 无硬编码端口（白名单 config.js 除外）
HITS=$(grep -rnE 'localhost:[0-9]{2,5}|listen\([0-9]' "$BACKEND_DIR" --include='*.js' 2>/dev/null | grep -v "$PORT_WHITELIST" | grep -v '__tests__' || true)
if [ -z "$HITS" ]; then pass "A8: 后端无硬编码端口"
else fail "A8: 硬编码端口: $(echo "$HITS" | head -3 | cut -d: -f1-2 | tr '\n' ' ')"; fi

echo "=== verify.sh — B 类交付门槛 ==="

# B1 前端构建（build-stamp 缓存命中可跳）
STAMP="$ROOT/.harness/scripts/build-stamp.sh"
if [ "${VERIFY_FORCE_BUILD:-0}" != "1" ] && bash "$STAMP" check >/dev/null 2>&1; then
  pass "B1: 前端构建（stamp 命中，跳过重建）"
elif (cd "$FRONTEND_DIR" && npm run build >/dev/null 2>&1); then
  bash "$STAMP" write >/dev/null 2>&1 || true
  pass "B1: 前端构建成功"
else
  fail "B1: 前端构建失败（cd frontend && npm run build 查看详情）"
fi

# B2 seeder 语法正确
if node --check "$BACKEND_DIR/seeder.js" >/dev/null 2>&1; then pass "B2: seeder.js 语法正确"
else fail "B2: seeder.js 语法错误"; fi

# B3 后端启动冒烟
if bash "$ROOT/.harness/scripts/backend-smoke.sh" >/dev/null 2>&1; then pass "B3: 后端启动冒烟通过"
else fail "B3: 后端启动冒烟失败（bash .harness/scripts/backend-smoke.sh 查看详情）"; fi

# B4 E2E 证据审计（设 VERIFY_TASK 时生效）
if [ -n "${VERIFY_TASK:-}" ]; then
  if python3 "$ROOT/.harness/scripts/check-e2e-evidence.py" audit "$VERIFY_TASK" --duplicates-as-warn >/dev/null 2>&1; then
    pass "B4: E2E 证据审计通过（task=$VERIFY_TASK）"
  else
    fail "B4: E2E 证据审计失败（python3 .harness/scripts/check-e2e-evidence.py audit $VERIFY_TASK）"
  fi
else
  pass "B4: E2E 证据审计（未设 VERIFY_TASK，本项跳过）"
fi

echo "=== verify.sh — C 类工程一致性 ==="

# C1 路由文件在 app.js 注册
C1_BAD=""
for f in "$ROUTES_DIR"/*.js; do
  [ -e "$f" ] || continue
  grep -q "$(basename "$f")" "$APP_ENTRY" || C1_BAD="$C1_BAD $(basename "$f")"
done
if [ -z "$C1_BAD" ]; then pass "C1: 所有路由文件已在 app.js 注册"
else fail "C1: 路由未在 app.js 注册:$C1_BAD"; fi

# C2 前端 Screen 在路由树注册
C2_BAD=""
for f in "$FRONTEND_SCREENS_DIR"/*Screen.jsx; do
  [ -e "$f" ] || continue
  grep -q "$(basename "$f" .jsx)" "$FRONTEND_ROUTER" || C2_BAD="$C2_BAD $(basename "$f")"
done
if [ -z "$C2_BAD" ]; then pass "C2: 所有 Screen 已在路由树注册"
else fail "C2: Screen 未在路由树注册:$C2_BAD"; fi

# C3 Model 文件 export default
C3_BAD=""
for f in "$MODELS_DIR"/*.js; do
  [ -e "$f" ] || continue
  grep -q 'export default' "$f" || C3_BAD="$C3_BAD $(basename "$f")"
done
if [ -z "$C3_BAD" ]; then pass "C3: 所有 Model 均 export default"
else fail "C3: Model 缺少 export default:$C3_BAD"; fi

# C4 前端 fetch 只允许出现在 api/ 层
HITS=$(grep -rln 'fetch(' "$FRONTEND_DIR/src" --include='*.jsx' --include='*.js' 2>/dev/null | grep -v "^$FRONTEND_API_DIR/" | grep -v '\.test\.' || true)
if [ -z "$HITS" ]; then pass "C4: 前端 API 调用集中在 api/ 层"
else fail "C4: api/ 层之外出现裸 fetch: $HITS"; fi

# C5 应用入口注册错误中间件（notFound + errorHandler）
if grep -q 'notFound' "$APP_ENTRY" && grep -q 'errorHandler' "$APP_ENTRY"; then
  pass "C5: notFound + errorHandler 已挂载"
else fail "C5: app.js 缺少 notFound/errorHandler 挂载"; fi

# C6 前端无 axios 依赖
if grep -q '"axios"' "$FRONTEND_DIR/package.json" 2>/dev/null; then
  warn "C6: 前端引入了 axios（约定统一走 api/client.js fetch 封装）"
else pass "C6: 前端未引入 axios"; fi

# C7 架构面 diff 必须同步 codebase-guide（文档硬校验）
if [ "${VERIFY_SKIP_CODEBASE_GUIDE:-0}" = "1" ]; then
  warn "C7: 已被 VERIFY_SKIP_CODEBASE_GUIDE=1 跳过（须在 dev-log 说明理由）"
elif ! git rev-parse HEAD >/dev/null 2>&1; then
  pass "C7: 仓库暂无提交基线，本项跳过"
else
  CHANGED=$( { git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard; } | sort -u)
  ARCH_TOUCHED=$(echo "$CHANGED" | grep -E "$ARCH_FACE_REGEX" || true)
  GUIDE_TOUCHED=$(echo "$CHANGED" | grep "^$GUIDE_DIR/" || true)
  if [ -z "$ARCH_TOUCHED" ]; then
    pass "C7: 本次改动未触及架构面路径"
  elif [ -n "$GUIDE_TOUCHED" ]; then
    pass "C7: 架构面改动已同步 codebase-guide"
  else
    fail "C7: 架构面改动未同步 codebase-guide（触及: $(echo "$ARCH_TOUCHED" | head -3 | tr '\n' ' ')）"
  fi
fi

echo "=== verify.sh 汇总 ==="
echo "通过: ${PASS} 项 · 警告: ${WARN} 项 · 失败: ${FAILED} 项"
if [ "$FAILED" -eq 0 ]; then
  echo "[PASS] verify.sh 整体通过"
  exit 0
else
  echo "[FAIL] verify.sh 存在 ${FAILED} 项失败"
  exit 1
fi
