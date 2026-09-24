import { defineConfig } from '@playwright/test';
import { join } from 'node:path';

const freshDatabasePath = join(process.cwd(), 'data', `e2e-${process.pid}-${Date.now()}.sqlite`);

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: false,
    env: { PORT: '4173', DATABASE_PATH: freshDatabasePath, AI_PROVIDER: 'mock' },
  },
  reporter: 'list',
});
