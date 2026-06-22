import { withSentryConfig } from '@sentry/nextjs';
import { withBotId } from 'botid/next/config';
import { fileURLToPath } from 'url';

import { buildRedirects } from './config/redirects.mjs';
import { createSentryBuildConfig } from './sentry/config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use separate build directory for dev server to avoid conflicts with production builds
    distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
    images: {
        remotePatterns: [
            {
                hostname: 'raw.githubusercontent.com',
                pathname: '/solana-labs/token-list/main/assets/**',
                port: '',
                protocol: 'https',
            },
        ],
    },
    // bigint-buffer loads its native .node via `bindings`, which walks up from the module's real
    // path — bundling it breaks that lookup and forces the pure-JS fallback warning.
    serverExternalPackages: ['bigint-buffer'],
    async headers() {
        const seoFileHeaders = [
            {
                key: 'Cache-Control',
                value: 'public, max-age=3600, stale-while-revalidate=86400',
            },
        ];

        return [
            { source: '/robots.txt', headers: seoFileHeaders },
            { source: '/sitemap.xml', headers: seoFileHeaders },
            { source: '/default-sitemap.xml', headers: seoFileHeaders },
            { source: '/accounts-sitemap.xml', headers: seoFileHeaders },
        ];
    },
    async redirects() {
        return buildRedirects();
    },
    turbopack: {
        // Pin to project root; otherwise Turbopack walks up to a parent pnpm-workspace.yaml (e.g. in git worktrees).
        root: fileURLToPath(new URL('.', import.meta.url)),
        resolveAlias: {
            // resolve-domain.ts uses deserializeUnchecked, removed in borsh@2 (also installed as borsh2).
            borsh: './node_modules/borsh',
            // @coral-xyz/anchor's nodewallet/workspace require('fs'), but those paths never run in the browser.
            fs: { browser: './empty.ts' },
        },
    },
};

export default withBotId(withSentryConfig(nextConfig, createSentryBuildConfig()));
