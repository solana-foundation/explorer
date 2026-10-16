import { CLIENT_REPORT_ALLOWED, CLIENT_REPORT_TAG } from '../client-report.mjs';
import {
    clientErrorsEnabled,
    clientSentryDsn,
    sentryEnvironment,
    serverSentryDsn,
    sourcemapUploadsDisabled,
    traceSampleRateMultiplier,
} from './env.mjs';
import { vitalsTraceSampleRate } from './vitals.mjs';

/**
 * @typedef {'client' | 'server' | 'edge'} RuntimeContext
 * @typedef {Exclude<RuntimeContext, 'client'>} ServerRuntime
 */

// Server/edge errors are rare and each one matters; the client starts near zero until quota headroom is measured.
// Raise the client rate ×100 per step, and only while 100× the measured client volume fits quota.
/** @type {Record<RuntimeContext, number>} */
const ERROR_SAMPLE_RATES = {
    client: 1 / 1000000,
    edge: 1,
    server: 1,
};

// Server traces are ~5 spans each. Raise ×10 per step, and only while 10× the measured span volume fits quota.
const SERVER_TRACE_SAMPLE_RATE = 1 / 100000;

// Edge shares the server rate so one rollout step moves both; the client has no baseline, see tracesSampler.
/** @type {Record<ServerRuntime, number>} */
const TRACE_SAMPLE_RATES = {
    edge: SERVER_TRACE_SAMPLE_RATE,
    server: SERVER_TRACE_SAMPLE_RATE,
};

// Never-sample name substrings: categories that are noise at any rate, excluded before every other rule.
const TRACE_EXCLUDES = [
    '/.well-known', // bot and devtools probes
    'suspense-cache.vercel-infra.com', // Vercel infra, e.g. GET https://iad1.suspense-cache.vercel-infra.com/v1/*
];

/**
 * Creates the common Sentry configuration for all runtimes
 * @param {RuntimeContext} context - The runtime context (client, server, or edge)
 * @returns {import('@sentry/core').Options} Sentry configuration options
 */
export function createSentryConfig(context) {
    return {
        dsn: context === 'client' ? clientSentryDsn() : serverSentryDsn(),

        // The flag allows the feedback form to run without browser error reporting.
        // The tag drops SDK auto-captures and direct captureException calls, which bot traffic triggers.
        // beforeSend receives error events only, so feedback events skip this check.
        ...(context === 'client' && {
            beforeSend: (/** @type {import('@sentry/core').ErrorEvent} */ event) =>
                clientErrorsEnabled() && event.tags?.[CLIENT_REPORT_TAG] === CLIENT_REPORT_ALLOWED
                    ? event
                    : // eslint-disable-next-line unicorn/no-null -- Sentry's drop signal is null
                      null,
        }),

        sampleRate: ERROR_SAMPLE_RATES[context],

        tracesSampler: (/** @type {import('@sentry/core').TracesSamplerSamplingContext} */ samplingContext) => {
            if (TRACE_EXCLUDES.some(exclude => samplingContext.name.includes(exclude))) {
                return 0;
            }

            // Browser pageloads emit hundreds of spans, so the opt-in vitals gate is the only source of client traces.
            if (context === 'client') {
                return vitalsTraceSampleRate(samplingContext) ?? 0;
            }

            // Ignore parentSampled: a caller's sentry-trace header could force sampling past TRACE_SAMPLE_RATES.
            // The env multiplier scales a runtime's baseline in an emergency (0 mutes); unset = unchanged.
            return TRACE_SAMPLE_RATES[context] * (traceSampleRateMultiplier(context) ?? 1);
        },

        // Enable logs to be sent to Sentry
        enableLogs: false,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        environment: sentryEnvironment(context),
    };
}

/**
 * Creates the Sentry build configuration for webpack plugin
 * @returns {import('@sentry/nextjs').SentryBuildOptions} Sentry build configuration options
 */
export function createSentryBuildConfig() {
    return {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PRJ,

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // Don't send telemetry about the build to Sentry.
        telemetry: false,

        // Webpack plugin options
        webpack: {
            // Enables automatic instrumentation of Vercel Cron Monitors
            automaticVercelMonitors: true,
            // Automatically tree-shake Sentry logger statements to reduce bundle size
            treeshake: {
                removeDebugLogging: true,
            },
        },

        // Previews don't need symbolicated traces: uploading 800+ maps × 3 runtimes added ~90s/build.
        sourcemaps: {
            disable: sourcemapUploadsDisabled(),
        },

        // Off: widening pulls node_modules chunks into the upload.
        widenClientFileUpload: false,
    };
}
