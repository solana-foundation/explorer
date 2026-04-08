import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const specWorkspace = (name = 'specs') => ({
    environment: 'jsdom',
    globals: true,
    name,
    server: {
        deps: {
            inline: [
                '@noble',
                'change-case',
                '@react-hook/previous',
                '@solana/kit',
                '@solana/rpc',
                '@solana/rpc-spec',
                '@solana/event-target-impl',
                '@solana/addresses',
            ],
        },
    },
    setupFiles: ['./test-setup.ts'],
    testTimeout: 10000,
});

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@/': path.resolve(__dirname, './'),

            '@/app': path.resolve(__dirname, './app'),
            '@/components': path.resolve(__dirname, './app/components'),
            '@/providers': path.resolve(__dirname, './app/providers'),
            '@/utils': path.resolve(__dirname, './app/utils'),
            '@/validators': path.resolve(__dirname, './app/validators'),

            // @ aliases
            '@app': path.resolve(__dirname, './app'),
            '@img': path.resolve(__dirname, './app/img'),
            '@components': path.resolve(__dirname, './app/components'),
            '@entities': path.resolve(__dirname, './app/entities'),
            '@features': path.resolve(__dirname, './app/features'),
            '@providers': path.resolve(__dirname, './app/providers'),
            '@shared': path.resolve(__dirname, './app/components/shared'),
            '@utils': path.resolve(__dirname, './app/utils'),
            '@storybook-config': path.resolve(__dirname, './.storybook'),
            '@validators': path.resolve(__dirname, './app/validators'),
        },
        conditions: ['browser', 'default'],
    },
    test: {
        exclude: ['**/node_modules/**', '.claude/**'],
        projects: [
            {
                extends: true,
                test: {
                    name: 'specs',
                    setupFiles: ['./test-setup.specs.ts'],
                    typecheck: {
                        enabled: true,
                    },
                },
            },
            {
                extends: true,
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
        ],
        coverage: {
            provider: 'v8',
        },
        poolOptions: {
            threads: {
                useAtomics: true,
            },
        },
        ...specWorkspace(),
    },
});
