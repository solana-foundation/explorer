import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { statusError } from '../feature';
import { logProxyError, logResourceFetched } from '../log-proxy-error';

describe('logProxyError', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        {
            code: 'oversize-declared',
            context: { declaredContentLength: 500, host: 'hello.world', maxSize: 100 },
            message: 'Resource exceeds max size (Content-Length)',
            status: 413,
        },
        {
            code: 'oversize-streamed',
            context: { host: 'hello.world', maxSize: 100 },
            message: 'Resource exceeds max size (streamed)',
            status: 413,
        },
        { code: 'unreachable', context: { url: 'http://hello.world/' }, message: 'Fetch failed', status: 502 },
    ] as const)('should report $code to Sentry with its context as extras', ({ code, context, message, status }) => {
        logProxyError(statusError(status, 'site message', { code, context }));

        expect(Logger.warn).toHaveBeenCalledWith(`[api:metadata-proxy] ${message}`, {
            ...context,
            sentry: true,
            sentryExtras: context,
        });
    });

    it('should log a warning without Sentry for an untracked code', () => {
        const context = { hostname: '10.0.0.1', reason: 'private address 10.0.0.1' };

        logProxyError(statusError(403, 'Hostname resolution blocked', { code: 'ssrf-blocked', context }));

        expect(Logger.warn).toHaveBeenCalledWith(
            '[api:metadata-proxy] Hostname resolution blocked (SSRF protection)',
            context,
        );
    });

    it('should fall back to the error message for a code without its own log message', () => {
        const context = { url: 'http://hello.world/' };

        logProxyError(statusError(504, 'Upstream fetch timed out', { code: 'timeout', context }));

        expect(Logger.debug).toHaveBeenCalledWith('[api:metadata-proxy] Upstream fetch timed out', context);
        expect(Logger.warn).not.toHaveBeenCalled();
    });
});

describe('logResourceFetched', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should log the fetched size with the content type read from the headers', () => {
        const headers = new Headers({ 'content-type': 'image/png' });

        logResourceFetched({ byteLength: 42, data: new ArrayBuffer(42), headers, host: 'cdn.hello.world' }, 100);

        expect(Logger.info).toHaveBeenCalledWith('[api:metadata-proxy] Resource fetched', {
            byteLength: 42,
            contentType: 'image/png',
            host: 'cdn.hello.world',
            maxSize: 100,
        });
    });
});
