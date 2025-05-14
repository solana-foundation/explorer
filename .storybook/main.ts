import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/experimental-addon-test'],
    framework: {
        name: '@storybook/experimental-nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
};
export default config;
