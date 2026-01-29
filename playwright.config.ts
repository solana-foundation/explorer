import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './app',
    testMatch: '**/*.e2e.{ts,tsx}',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 90000,
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        actionTimeout: 30000,
        navigationTimeout: 60000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        timeout: 120000,
        reuseExistingServer: !process.env.CI,
    },
});
