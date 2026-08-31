import { execSync } from 'child_process';

// E2E 前灌种子，保证数据前置一致。
export default function globalSetup() {
  execSync('node backend/seeder.js', { stdio: 'inherit' });
}
