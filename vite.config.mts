import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            globals: {
                Buffer: true,
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
        poolOptions: {
            threads: {
                useAtomics: true,
            },
        },
        workspace: [
            {
                extends: true,
                test: {
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
        ],
    },
});
