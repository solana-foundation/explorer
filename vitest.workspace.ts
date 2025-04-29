import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
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
            storybookTest({ configDir: path.join(dirname, '.storybook') }),
            nodePolyfills({
                globals: {
                    Buffer: true, // can also be 'build', 'dev', or false
                    global: true,
                    process: true,
                },
                include: ['path', 'util'],
            }),
        ],
        test: {
            browser: {
                enabled: true,
                headless: true,
                name: 'chromium',
                provider: 'playwright',
            },
            environment: 'jsdom',
            globals: true,
            name: 'storybook',
            server: {
                deps: {
                    inline: ['@noble', 'change-case', '@react-hook/previous'],
                },
            },
            setupFiles: ['./test-setup.ts', '.storybook/vitest.setup.ts'],
            testTimeout: 10000,
        },
    },
]);
