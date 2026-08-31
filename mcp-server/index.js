#!/usr/bin/env node
// Harness MCP Server — Scripts 层的上层封装（不引入额外判定逻辑，底层仍是 Bash 脚本）。
// 定位：备用接口层 + 手动 ad-hoc 查询 + 跨 OS 兼容备选；当前主流程走直接 bash。
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runCommand(cmd, { timeout = 60_000 } = {}) {
  try {
    const out = execSync(cmd, { cwd: ROOT, timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e) {
    const out = [e.stdout, e.stderr, e.message].filter(Boolean).join('\n');
    return { ok: false, out };
  }
}

function textResult(title, { ok, out }) {
  const icon = ok ? '✅' : '❌';
  return { content: [{ type: 'text', text: `=== ${title} ===\n${icon} ${ok ? 'PASS' : 'FAIL'}\n${out}` }] };
}

const server = new McpServer({ name: 'harness', version: '1.0.0' });

server.tool(
  'check_backend',
  '启动后端、验证根路径响应、关闭（backend-smoke.sh，超时守护自适应）',
  async () => textResult('check_backend', runCommand('bash .harness/scripts/backend-smoke.sh', { timeout: 30_000 }))
);

server.tool(
  'build_frontend',
  '前端生产构建（强制完整构建，不走指纹缓存）',
  async () => textResult('build_frontend', runCommand('npm run build', { timeout: 120_000 }))
);

server.tool(
  'run_verification',
  'verify.sh 总验证（A/B/C 三类 19 检查点，含 C7 codebase-guide 同步）',
  async () => textResult('run_verification', runCommand('bash .harness/scripts/verify.sh', { timeout: 300_000 }))
);

server.tool(
  'baseline_snapshot',
  '记录当前 verify FAIL 项基线到 .harness/baseline.json（任务启动时）',
  async () => textResult('baseline_snapshot', runCommand('bash .harness/scripts/baseline.sh snapshot', { timeout: 300_000 }))
);

server.tool(
  'baseline_compare',
  '与基线对比：出现新增 FAIL 项即失败（回归检测）',
  async () => textResult('baseline_compare', runCommand('bash .harness/scripts/baseline.sh compare', { timeout: 300_000 }))
);

server.tool(
  'seed_database',
  '灌种子数据（破坏性：清空重建 backend/data/db.json）',
  async () => textResult('seed_database', runCommand('npm run data:import', { timeout: 60_000 }))
);

server.tool(
  'check_harness',
  '框架完整性校验（90+ 项：文件存在性/契约完整性/三边校验/Profile 配置等）',
  async () => textResult('check_harness', runCommand('bash .harness/scripts/check-harness.sh', { timeout: 120_000 }))
);

server.tool(
  'get_project_structure',
  '项目文件结构（maxdepth 4，排除 node_modules/.git/dist）',
  async () =>
    textResult(
      'get_project_structure',
      runCommand("find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.playwright-cli/*' | sort", { timeout: 30_000 })
    )
);

await server.connect(new StdioServerTransport());
console.error('harness MCP server ready (stdio)');
