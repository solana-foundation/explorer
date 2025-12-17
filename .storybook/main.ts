import type { StorybookConfig } from '@storybook/nextjs-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
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
        };
    },
};
export default config;
