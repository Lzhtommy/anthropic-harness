// 唯一允许出现端口/密钥默认值的文件（verify.sh A8 以此为白名单）。
// 优先级：环境变量 > 项目根 .env > 默认值。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readDotEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const dotEnv = readDotEnv();
const env = (key, fallback) => process.env[key] ?? dotEnv[key] ?? fallback;

const config = {
  rootDir,
  port: Number(env('PORT', 5001)),
  secret: env('APP_SECRET', 'harness-demo-secret'),
  dbFile: path.join(rootDir, 'backend', 'data', 'db.json'),
};

export default config;
