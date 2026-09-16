import type { ErrorEvent } from '@sentry/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLIENT_REPORT_ALLOWED, CLIENT_REPORT_TAG } from '../client-report.mjs';
import { createSentryConfig } from '../config.mjs';

function clientBeforeSend() {
    const { beforeSend } = createSentryConfig('client');
    if (!beforeSend) throw new Error('client config is expected to define beforeSend');
    return beforeSend;
}

const taggedEvent = (): ErrorEvent => ({ tags: { [CLIENT_REPORT_TAG]: CLIENT_REPORT_ALLOWED }, type: undefined });

describe('createSentryConfig beforeSend guard', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
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
        expect(clientBeforeSend()({ tags: {}, type: undefined }, {})).toBeNull();
    });

    it('should drop browser events whose tag carries any other value', () => {
        const event: ErrorEvent = { tags: { [CLIENT_REPORT_TAG]: 'spoofed' }, type: undefined };

        expect(clientBeforeSend()(event, {})).toBeNull();
    });

    it('should drop tagged browser events when the client errors flag is unset', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', '');

        expect(clientBeforeSend()(taggedEvent(), {})).toBeNull();
    });

    it('should drop tagged browser events when the client errors flag is not exactly true', () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', '1');

        expect(clientBeforeSend()(taggedEvent(), {})).toBeNull();
    });

    it('should read the flag per event rather than when the config is built', () => {
        const beforeSend = clientBeforeSend();
        vi.stubEnv('NEXT_PUBLIC_SENTRY_CLIENT_ERRORS', 'false');

        expect(beforeSend(taggedEvent(), {})).toBeNull();
    });
});
