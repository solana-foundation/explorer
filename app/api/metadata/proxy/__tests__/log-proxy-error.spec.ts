import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { statusError } from '../feature';
import { logProxyError } from '../log-proxy-error';

describe('logProxyError', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should report a Sentry-tracked code with its context as Sentry extras', () => {
        const context = { declaredContentLength: 500, host: 'hello.world', maxSize: 100 };

        logProxyError(
            statusError(413, 'Content-Length 500 exceeds max size 100', { code: 'oversize-declared', context }),
        );

        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Resource exceeds max size (Content-Length)', {
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
