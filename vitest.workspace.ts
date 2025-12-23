import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineWorkspace } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineWorkspace([
    'vite.config.mts',
    {
        extends: 'vite.config.mts',
        optimizeDeps: {
            include: [
                'vite-plugin-node-polyfills/shims/buffer',
                'vite-plugin-node-polyfills/shims/global',
                'vite-plugin-node-polyfills/shims/process',
            ],
        },
        plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
            storybookTest({
                configDir: path.join(dirname, '.storybook'),
                tags: {
                    include: ['test'],
                    exclude: ['experimental'],
                },
            }),
        ],
        test: {
            name: 'storybook',
            browser: {
                enabled: true,
                headless: true,
                // Firefox is disabled in CI due to flaky connection timeouts
                instances: process.env.CI
                    ? [{ browser: 'chromium' }]
                    : [{ browser: 'chromium' }, { browser: 'firefox' }],
                provider: 'playwright',
                isolate: true,
                connectTimeout: 30000,
            },
            setupFiles: ['./test-setup.ts', './.storybook/vitest.setup.ts'],
            testTimeout: 15000,
            hookTimeout: 30000,
            retry: 1,
            sequence: {
                concurrent: false,
            },
        },
    },
]);
