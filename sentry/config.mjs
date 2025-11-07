/**
 * @typedef {'client' | 'server' | 'edge'} RuntimeContext
 */

/**
 * Creates the common Sentry configuration for all runtimes
 * @param {RuntimeContext} _context - The runtime context (client, server, or edge)
 * @returns {Object} Sentry configuration options
 */
export function createSentryConfig(_context) {
    return {
        sampleRate: 0.1, // Track 10% of issues

        // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
        tracesSampler: (/** @type {import('@sentry/core').TracesSamplerSamplingContext} */ samplingContext) => {
            // Don't sample .well-known
            if (samplingContext.name.includes('/.well-known')) {
                return 0;
            }

            // Don't sample health checks or monitoring endpoints
            if (samplingContext.name.includes('/api/ping')) {
                return 0;
            }

            // Don't sample all other api endpoints as we should rely on logging
            if (samplingContext.name.includes('/api/')) {
                return 0;
            }

            // Don't sample infrastructure requests:
            // - GET https://iad1.suspense-cache.vercel-infra.com/v1/suspense-cache/*
            if (samplingContext.name.includes('suspense-cache.vercel-infra.com')) {
                return 0;
            }

            // We encountered the peak of 24M spans per day
            // Adjust the rate to fit the monthly quote
            return process.env.NODE_ENV === 'production' ? 5e-9 : 1;
        },

        // Enable logs to be sent to Sentry
        enableLogs: false, // eslint-disable-line sort-keys-fix/sort-keys-fix

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false, // eslint-disable-line sort-keys-fix/sort-keys-fix

        environment: process.env.NODE_ENV,
    };
}

/**
 * Creates the Sentry build configuration for webpack plugin
 * @returns {Object} Sentry build configuration options
 */
export function createSentryBuildConfig() {
    // Respect the SENTRY_TELEMETRY_DISABLE environment variable
    const telemetryDisabled = process.env.SENTRY_TELEMETRY_DISABLE === 'true';

    return {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PRJ,

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // This will be false in CI (disabled) and true in production (enabled)
        telemetry: !telemetryDisabled,

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true, // eslint-disable-line sort-keys-fix/sort-keys-fix,

        // Enables automatic instrumentation of Vercel Cron Monitors
        automaticVercelMonitors: true, // eslint-disable-line sort-keys-fix/sort-keys-fix
    };
}
