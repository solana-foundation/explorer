import { withSentryConfig } from '@sentry/nextjs';
import { withBotId } from 'botid/next/config';
import { fileURLToPath } from 'url';

import { buildHeaders } from './config/headers.mjs';
import { buildRedirects } from './config/redirects.mjs';
import { createSentryBuildConfig } from './sentry/config.mjs';

// Pin both file-tracing and Turbopack to the project root; otherwise Next walks up to a parent
// pnpm-workspace.yaml (e.g. in git worktrees) and the two roots disagree.
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use separate build directory for dev server to avoid conflicts with production builds
    distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
    outputFileTracingRoot: projectRoot,
    // The tx OG route reads these off disk at runtime to hand satori.
    outputFileTracingIncludes: {
        '/og/tx/[signature]': ['./public/fonts/**', './public/img/og/**'],
    },
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
        return buildHeaders();
    },
    async redirects() {
        return buildRedirects();
    },
    turbopack: {
        root: projectRoot,
        resolveAlias: {
            // @coral-xyz/anchor's nodewallet/workspace require('fs'), but those paths never run in the browser.
            fs: { browser: './empty.ts' },
        },
    },
};

export default withBotId(withSentryConfig(nextConfig, createSentryBuildConfig()));
