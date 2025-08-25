import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADDRESS_ALIASES = ['account', 'accounts', 'addresses'];
const TX_ALIASES = ['txs', 'txn', 'txns', 'transaction', 'transactions'];
const SUPPLY_ALIASES = ['accounts', 'accounts/top'];

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // FIXME: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
        missingSuspenseWithCSRBailout: false,
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
    async redirects() {
        return [
            // Leave this above `ADDRESS_ALIASES`, since it also provides an alias for `/accounts`.
            ...SUPPLY_ALIASES.map(oldRoot => ({
                destination: '/supply',
                permanent: true,
                source: '/' + oldRoot,
            })),
            ...ADDRESS_ALIASES.flatMap(oldRoot =>
                [':address', ':address/:tab'].map(path => ({
                    destination: '/' + ['address', path].join('/'),
                    permanent: true,
                    source: '/' + [oldRoot, path].join('/'),
                }))
            ),
            ...TX_ALIASES.map(oldRoot => ({
                destination: '/' + ['tx', ':signature'].join('/'),
                permanent: true,
                source: '/' + [oldRoot, ':signature'].join('/'),
            })),
            {
                destination: '/address/:address',
                permanent: true,
                source: '/address/:address/history',
            },
        ];
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

/// Add wrapper to track errors with Sentry
export default withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: process.env.SENTRY_ORG,

    project: process.env.SENTRY_PRJ,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true, // eslint-disable-line  sort-keys-fix/sort-keys-fix

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true, // eslint-disable-line  sort-keys-fix/sort-keys-fix
});

/// We going to handle Sentry errors step-by-step by cathcing unhandled exceptions route-wise
/// See: https://nextjs.org/docs/app/getting-started/error-handling#nested-error-boundaries
/// FEAT: Next step would be adding a layer to catch errors globally.
/// At this point we catch just the errors for a new functionality
/// Use the code below to enable it globally in the future
/// #<PROJECT_ROOT>/app/global-error.tsx
// 'use client';

// import * as Sentry from '@sentry/nextjs';
// import NextError from 'next/error';
// import { useEffect } from 'react';

// export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
//     useEffect(() => {
//         Sentry.captureException(error);
//     }, [error]);

//     return (
//         <html>
//             <body>
//                 {/* `NextError` is the default Next.js error page component. Its type
//                 definition requires a `statusCode` prop. However, since the App Router
//                 does not expose status codes for errors, we simply pass 0 to render a
//                 generic error message. */}
//                 <NextError statusCode={0} />
//             </body>
//         </html>
//     );
// }
