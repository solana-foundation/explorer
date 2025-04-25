import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

const specWorkspace = (name = 'specs') => ({
    environment: 'jsdom',
    globals: true,
    name,
    server: {
        deps: {
            inline: ['@noble', 'change-case', '@react-hook/previous'],
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
        ...specWorkspace(),
    },
});
