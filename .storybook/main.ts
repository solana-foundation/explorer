import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';
import type { AliasOptions } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Normalize Vite's `resolve.alias` to array form so regex `find` entries can be appended.
function toAliasArray(alias: AliasOptions | undefined) {
    if (Array.isArray(alias)) return alias;
    return Object.entries(alias ?? {}).map(([find, replacement]) => ({
        find,
        replacement,
    }));
}

const config: StorybookConfig = {
    stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-vitest', '@storybook/addon-a11y'],
    features: {
        // Core renders the "Level up" checklist widget in dev unless this is false; STORYBOOK_ONBOARDING_UI=true opts in.
        sidebarOnboardingChecklist: process.env.STORYBOOK_ONBOARDING_UI === 'true',
    },
    core: {
        disableTelemetry: true,
    },
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
                    include: ['path', 'stream', 'util', 'buffer'],
                }),
            ],
            resolve: {
                ...config.resolve,
                alias: [
                    ...toAliasArray(config.resolve?.alias),
                    // Mock @bundlr-network/client which uses Node.js stream.Transform incompatible with browser
                    {
                        find: '@bundlr-network/client',
                        replacement: path.resolve(__dirname, './__mocks__/@bundlr-network/client.ts'),
                    },
                    // Stub useCollectionNfts so suspense-mode SWR never fires getProgramAccounts.
                    {
                        // eslint-disable-next-line no-restricted-syntax -- module path matcher for Vite alias
                        find: /^\.\/nftoken-hooks(?:\.tsx?)?$/,
                        replacement: path.resolve(__dirname, './__mocks__/nftoken-hooks.tsx'),
                    },
                ],
            },
        };
    },
};
export default config;
