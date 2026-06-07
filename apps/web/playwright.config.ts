import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// E2E tests run against a locally running dev stack (frontend + backend).
// They are NOT part of CI yet — CI has no DB/Redis/.env. Run locally with:
//   npx playwright install   (one-time, downloads browsers)
//   npm run test:e2e
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // Starts the whole turbo dev (api + web) from the repo root if not already running.
    webServer: {
        command: 'npm run dev',
        cwd: path.resolve(__dirname, '../..'),
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
