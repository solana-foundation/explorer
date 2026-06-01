import { withSentryConfig } from '@sentry/nextjs';
import { withBotId } from 'botid/next/config';

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
        resolveAlias: {
            // resolve-domain.ts uses deserializeUnchecked, removed in borsh@2 (also installed as borsh2).
            borsh: './node_modules/borsh',
            // @coral-xyz/anchor's nodewallet/workspace require('fs'), but those paths never run in the browser.
            fs: { browser: './empty.ts' },
        },
    },
};

export default withBotId(withSentryConfig(nextConfig, createSentryBuildConfig()));
