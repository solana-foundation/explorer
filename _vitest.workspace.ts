import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineWorkspace } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export const config = defineWorkspace([
    'vite.config.mts',
    {
        extends: 'vite.config.mts',
        plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
            storybookTest({ configDir: path.join(dirname, '.storybook') }),
            nodePolyfills({
                // // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
                // exclude: [
                //     'http', // Excludes the polyfill for `http` and `node:http`.
                // ],
                // Whether to polyfill specific globals.
                globals: {
                    Buffer: true, // can also be 'build', 'dev', or false
                    global: true,
                    process: true,
                },
                // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
                include: ['path', 'util'],
                // // Override the default polyfills for specific modules.
                // overrides: {
                //     // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
                //     fs: 'memfs',
                // },
                // // Whether to polyfill `node:` protocol imports.
                // protocolImports: false,
            }),
        ],
        test: {
            browser: {
                enabled: true,
                headless: true,
                name: 'chromium',
                provider: 'playwright',
            },
            name: 'storybook',
            setupFiles: ['.storybook/vitest.setup.ts'],
        },
    },
]);
