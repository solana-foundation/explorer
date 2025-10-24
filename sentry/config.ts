import { ClientOptions, TracesSamplerSamplingContext } from '@sentry/core';

type RuntimeContext = 'client' | 'server' | 'edge';

// Extend ClientOptions to include telemetry option
interface SentryConfig extends Partial<ClientOptions> {
    telemetry?: boolean;
}

/**
 * Creates the common Sentry configuration for all runtimes
 * @param context - The runtime context (client, server, or edge)
 * @returns Sentry configuration options
 */
export function createSentryConfig(_context: RuntimeContext): SentryConfig {
    return {
        sampleRate: 0.1, // Track 10% of issues

        // Respect the SENTRY_TELEMETRY_DISABLE environment variable
        // This will be false in CI (disabled) and true in production (enabled)
        telemetry: process.env.SENTRY_TELEMETRY_DISABLE !== 'true',

        // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
        tracesSampler: (samplingContext: TracesSamplerSamplingContext) => {
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
            return process.env.NODE_ENV === 'production' ? 0.0005 : 1;
        },

        // Enable logs to be sent to Sentry
        enableLogs: false, // eslint-disable-line sort-keys-fix/sort-keys-fix

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false, // eslint-disable-line sort-keys-fix/sort-keys-fix

        environment: process.env.NODE_ENV,
    };
}
