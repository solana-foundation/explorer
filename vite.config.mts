import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const config = defineConfig(
    (function () {
        // const storybookPlugin = await storybookTest({ configDir: path.join(dirname, '.storybook') });
        return {
            plugins: [
                nodePolyfills({
                    globals: {
                        Buffer: true, // can also be 'build', 'dev', or false
                        global: true,
                    },
                    protocolImports: true,
                }),
            ],
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
                    '@components': path.resolve(__dirname, './app/components'),
                    '@providers': path.resolve(__dirname, './app/providers'),
                    '@utils': path.resolve(__dirname, './app/utils'),
                    '@validators': path.resolve(__dirname, './app/validators'),
                },
            },
            test: {
                coverage: {
                    provider: 'v8',
                },
                name: 'root',
                poolOptions: {
                    threads: {
                        useAtomics: true,
                    },
                },
                workspace: [
                    {
                        // Specs
                        extends: true,
                        plugins: [react()],
                        test: {
                            browser: {
                                enabled: false,
                            },
                            environment: 'jsdom',
                            globals: true,
                            name: 'specs',
                            server: {
                                deps: {
                                    inline: ['@noble', 'change-case', '@react-hook/previous'],
                                },
                            },
                            setupFiles: './test-setup.ts',
                            testTimeout: 10000,
                        },
                    },
                    {
                        // Storybook
                        extends: true,
                        globals: true,
                        include: ['.storybook/**'],
                        plugins: [
                            // react(),
                            // nodePolyfills({
                            //     globals: {
                            //         Buffer: true, // can also be 'build', 'dev', or false
                            //         global: true,
                            //         // process: true,
                            //     },
                            //     include: ['child_process'],
                            //     protocolImports: true,
                            // }),
                            storybookTest({ configDir: path.join(dirname, '.storybook') }),
                        ],
                        test: {
                            browser: {
                                enabled: true,
                                headless: true,
                                name: 'chromium',
                                provider: 'playwright',
                            },
                            name: 'stories',
                            setupFiles: ['.storybook/vitest.setup.ts'],
                        },
                    },
                ],
            },
        };
    })()
);

export default config;
