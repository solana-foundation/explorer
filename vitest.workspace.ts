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
                instances: [{ browser: 'chromium' }],
                provider: 'playwright',
            },
            setupFiles: ['./test-setup.ts', '.storybook/vitest.setup.ts'],
            testTimeout: 10000,
        },
    },
]);
