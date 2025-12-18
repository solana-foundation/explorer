import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-vitest', '@storybook/addon-a11y'],
    framework: {
        name: '@storybook/nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    async viteFinal(config) {
        return {
            ...config,
            plugins: [
                ...(config.plugins || []),
                nodePolyfills({
                    globals: {
                        Buffer: true,
                        global: true,
                        process: true,
                    },
                    include: ['path', 'util'],
                }),
            ],
            resolve: {
                ...config.resolve,
                alias: {
                    ...config.resolve?.alias,
                    // Mock @bundlr-network/client which uses Node.js stream.Transform incompatible with browser
                    '@bundlr-network/client': path.resolve(__dirname, './__mocks__/@bundlr-network/client.ts'),
                },
            },
        };
    },
};
export default config;
