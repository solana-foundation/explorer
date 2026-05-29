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
            // Force the legacy borsh@0.7.0 (the `borsh` dependency) for all `borsh` imports.
            // `borsh2` (npm:borsh@2.0.0) is a separate specifier and is unaffected.
            borsh: './node_modules/borsh',
            // Stub Node's `fs` in client bundles — packages like `@coral-xyz/anchor` reference it
            // but never execute that path on the client (was `resolve.fallback.fs = false` in webpack).
            fs: { browser: './empty.ts' },
        },
    },
};

/// Add wrapper to track errors with Sentry and BotID for bot protection
export default withBotId(withSentryConfig(nextConfig, createSentryBuildConfig()));
