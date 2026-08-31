import { defineConfig } from '@playwright/test';

// E2E 集合分层（课程约定）：
//   默认       → e2e/ 活跃回归集（忽略 _archived）
//   E2E_SET=archived → 仅归档集
//   E2E_SET=all      → 全量
const set = process.env.E2E_SET ?? 'active';
const testIgnore = set === 'active' ? ['**/_archived/**'] : [];
const testMatch =
  set === 'archived' ? ['_archived/**/*.e2e.js'] : ['**/*.e2e.js'];

const backendPort = process.env.PORT || 5001;

export default defineConfig({
  testDir: 'e2e',
  testMatch,
  testIgnore,
  globalSetup: './e2e/global-setup.js',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node backend/server.js',
      url: `http://localhost:${backendPort}/`,
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'npm run dev --prefix frontend',
      url: 'http://localhost:3000/',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
