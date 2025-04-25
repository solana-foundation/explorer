import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';
import { TestProjectConfiguration, UserWorkspaceConfig, mergeConfig } from 'vitest/config';
import workspaceConfig from '../vite.config.mts';
import { fileURLToPath } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/experimental-addon-test'],
    framework: {
        name: '@storybook/experimental-nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    _viteFinal: async config => {
        return mergeConfig(config, {
            plugins: [
                nodePolyfills({
                    include: ['child_process'],
                    globals: {
                        Buffer: true,
                        global: true,
                    },
                    protocolImports: true,
                }),
                // storybookTest({ configDir: path.join(dirname, '.storybook') }),
            ],
        });
    },
    // _viteFinal: async (config, { configType }) => {
    //     console.log({ config }, configType);

    //     const storybookConfig = (workspaceConfig.test?.workspace as UserWorkspaceConfig[])?.find(
    //         ({ test }) => test?.name === 'stories'
    //     );
    //     console.log(storybookConfig);
    //     if (!storybookConfig) {
    //         throw new Error('Storybook configuration not found');
    //     }

    //     const _plugins = [];
    //     storybookConfig.plugins?.forEach(async (plugin, index) => {
    //         if (plugin instanceof Promise) {
    //             _plugins[index] = await plugin;
    //         } else {
    //             _plugins[index] = plugin;
    //         }
    //     });

    //     storybookConfig.plugins = _plugins;

    //     return mergeConfig(config, {
    //         ...storybookConfig,
    //         // plugins: [storybookTest({ configDir: '..' })],
    //         //await storybookTest({ configDir: path.join(dirname, '../.storybook') })],
    //         // optimizeDeps: {
    //         //     // exclude: ['./layout.min.css'],
    //         // },
    //     });
    // },
};
export default config;
