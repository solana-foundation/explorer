import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/experimental-addon-test'],
    framework: {
        name: '@storybook/experimental-nextjs-vite',
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
                    },
                }),
            ],
        };
    },
};
export default config;
