import type { ErrorEvent, TracesSamplerSamplingContext } from '@sentry/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLIENT_REPORT_ALLOWED, CLIENT_REPORT_TAG } from '../../client-report.mjs';
import { createSentryConfig } from '../config.mjs';
import {
    clientSentryDsn,
    serverSentryDsn,
    sourcemapUploadsDisabled,
    traceSampleRateMultiplier,
    vitalsSampleRateMultiplier,
} from '../env.mjs';

const samplingContext = (name: string, op?: string): TracesSamplerSamplingContext => ({
    attributes: op ? { 'sentry.op': op } : {},
    inheritOrSampleWith: (fallback: number) => fallback,
    name,
});

const sample = (context: 'client' | 'server' | 'edge', name: string, op?: string): number | boolean => {
    const { tracesSampler } = createSentryConfig(context);
    if (!tracesSampler) {
        throw new Error('tracesSampler is not configured');
    }
    return tracesSampler(samplingContext(name, op));
};

const SERVER_BASELINE = 1 / 100000;

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('vitalsSampleRateMultiplier', () => {
    it.each(['0', '-1', 'garbage', 'Infinity', ''])('should return undefined for %j', value => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', value);
        expect(vitalsSampleRateMultiplier()).toBeUndefined();
    });

    it('should parse a rate within (0, 1]', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '0.5');
        expect(vitalsSampleRateMultiplier()).toBe(0.5);
    });

    it('should clamp values above 1', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '5');
        expect(vitalsSampleRateMultiplier()).toBe(1);
    });
});

describe('traceSampleRateMultiplier', () => {
    it('should read the per-runtime var', () => {
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_SERVER', '0.25');
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_EDGE', '0');
        expect(traceSampleRateMultiplier('server')).toBe(0.25);
        expect(traceSampleRateMultiplier('edge')).toBe(0);
    });

    // A blank value is the strictest case: it fails both a missing trim and a truthy pick of the edge var.
    it('should fall back to the server var when the edge var is blank', () => {
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_EDGE', ' ');
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_SERVER', '0.25');
        expect(traceSampleRateMultiplier('edge')).toBe(0.25);
    });
});

describe('DSN helpers', () => {
    it('should fall back to the public var on the server', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@sentry.example/1');
        vi.stubEnv('SENTRY_DSN', '');
        expect(serverSentryDsn()).toBe('https://public@sentry.example/1');
    });

    it('should leave the client without a DSN when only the private var is set', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
        vi.stubEnv('SENTRY_DSN', 'https://private@sentry.example/2');
        expect(clientSentryDsn()).toBeUndefined();
        expect(serverSentryDsn()).toBe('https://private@sentry.example/2');
    });
});

describe('createSentryConfig dsn', () => {
    it('should wire the public DSN for the client and the private one for server/edge', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@sentry.example/1');
        vi.stubEnv('SENTRY_DSN', 'https://private@sentry.example/2');
        expect(createSentryConfig('client').dsn).toBe('https://public@sentry.example/1');
        expect(createSentryConfig('server').dsn).toBe('https://private@sentry.example/2');
        expect(createSentryConfig('edge').dsn).toBe('https://private@sentry.example/2');
    });
});

describe('createSentryConfig environment', () => {
    it('should read the public Vercel var on the client and the private one on server/edge', () => {
        vi.stubEnv('VERCEL_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
        expect(createSentryConfig('client').environment).toBe('preview');
        expect(createSentryConfig('server').environment).toBe('production');
        expect(createSentryConfig('edge').environment).toBe('production');
    });

    it('should fall back to NODE_ENV outside Vercel', () => {
        vi.stubEnv('VERCEL_ENV', undefined);
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', undefined);
        vi.stubEnv('NODE_ENV', 'development');
        expect(createSentryConfig('client').environment).toBe('development');
        expect(createSentryConfig('server').environment).toBe('development');
        expect(createSentryConfig('edge').environment).toBe('development');
    });
});

describe('sourcemapUploadsDisabled', () => {
    it('should keep uploads on Vercel production only', () => {
        vi.stubEnv('VERCEL_ENV', 'production');
        expect(sourcemapUploadsDisabled()).toBe(false);
    });

    it('should disable uploads on previews unless the override is exactly true', () => {
        vi.stubEnv('VERCEL_ENV', 'preview');
        vi.stubEnv('ENABLE_SENTRY_SOURCEMAPS_AT_PREVIEW', '1');
        expect(sourcemapUploadsDisabled()).toBe(true);
    });

    it('should let the preview override opt uploads back in', () => {
        vi.stubEnv('VERCEL_ENV', 'preview');
        vi.stubEnv('ENABLE_SENTRY_SOURCEMAPS_AT_PREVIEW', 'true');
        expect(sourcemapUploadsDisabled()).toBe(false);
    });
});

describe('sampleRate', () => {
    it('should keep server and edge error events at full sample', () => {
        expect(createSentryConfig('server').sampleRate).toBe(1);
        expect(createSentryConfig('edge').sampleRate).toBe(1);
    });

    it('should sample client error events at 1e-6', () => {
        expect(createSentryConfig('client').sampleRate).toBe(1 / 1000000);
    });
});

describe('tracesSampler vitals gate', () => {
    it.each(['pageload', 'navigation'])('should scale the vitals rate for client %s', op => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '1');
        expect(sample('client', '/address/abc', op)).toBe(0.001);
    });

    it('should apply a fractional multiplier', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '0.5');
        expect(sample('client', '/address/abc', 'pageload')).toBe(0.0005);
    });

    it('should not sample other client ops', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '1');
        expect(sample('client', 'GET /api/foo', 'http.client')).toBe(0);
    });

    it('should sample server and edge at the shared baseline regardless of op', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '1');
        expect(sample('server', '/address/abc', 'pageload')).toBe(SERVER_BASELINE);
        expect(sample('edge', '/address/abc', 'pageload')).toBe(SERVER_BASELINE);
    });

    it('should not sample client pageloads when vitals sampling is off', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', undefined);
        expect(sample('client', '/address/abc', 'pageload')).toBe(0);
    });

    it('should scale the baseline with the per-runtime multiplier', () => {
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_SERVER', '0');
        vi.stubEnv('TELEMETRY_TRACE_SAMPLE_RATE_EDGE', '0.5');
        expect(sample('server', 'GET /address/abc')).toBe(0);
        expect(sample('edge', 'GET /address/abc')).toBe(SERVER_BASELINE * 0.5);
    });

    it('should ignore a sampled parent', () => {
        const { tracesSampler } = createSentryConfig('server');
        const parentSampledContext = {
            ...samplingContext('GET /address/abc'),
            inheritOrSampleWith: () => 1,
            parentSampled: true,
        };
        expect(tracesSampler?.(parentSampledContext)).toBe(SERVER_BASELINE);
    });

    it('should keep the zero branches ahead of the vitals gate', () => {
        vi.stubEnv('NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE', '1');
        expect(sample('client', '/.well-known/foo', 'pageload')).toBe(0);
        expect(sample('client', 'GET https://iad1.suspense-cache.vercel-infra.com/v1/x', 'pageload')).toBe(0);
    });
});

describe('createSentryConfig beforeSend guard', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', 'true');
    });

    it('should define beforeSend only for the client runtime', () => {
        expect(createSentryConfig('client').beforeSend).toBeTypeOf('function');
        expect(createSentryConfig('server').beforeSend).toBeUndefined();
        expect(createSentryConfig('edge').beforeSend).toBeUndefined();
    });

    it('should pass browser events carrying the Logger opt-in tag', () => {
        const event = taggedEvent();

        expect(clientBeforeSend()(event, {})).toBe(event);
    });

    it('should drop browser events without the opt-in tag', () => {
        expect(clientBeforeSend()({ type: undefined }, {})).toBeNull();
    });

    it('should drop browser events whose tag carries any other value', () => {
        const event: ErrorEvent = { tags: { [CLIENT_REPORT_TAG]: 'spoofed' }, type: undefined };

        expect(clientBeforeSend()(event, {})).toBeNull();
    });

    it('should drop tagged browser events when the client errors flag is not exactly true', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', '1');

        expect(clientBeforeSend()(taggedEvent(), {})).toBeNull();
    });
});

function clientBeforeSend() {
    const { beforeSend } = createSentryConfig('client');
    if (!beforeSend) throw new Error('client config is expected to define beforeSend');
    return beforeSend;
}

const taggedEvent = (): ErrorEvent => ({ tags: { [CLIENT_REPORT_TAG]: CLIENT_REPORT_ALLOWED }, type: undefined });
