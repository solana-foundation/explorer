import { withSentryConfig } from '@sentry/nextjs';
import { withBotId } from 'botid/next/config';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildRedirects } from './config/redirects.mjs';
import { createSentryBuildConfig } from './sentry/config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            borsh: path.resolve(__dirname, 'node_modules/borsh'), // force legacy version
        };

        if (!isServer) {
            // Fixes npm packages that depend on `fs` module like `@project-serum/anchor`.
            config.resolve.fallback.fs = false;
        }

        return config;
    },
};

/// Add wrapper to track errors with Sentry and BotID for bot protection
export default withBotId(withSentryConfig(nextConfig, createSentryBuildConfig()));
