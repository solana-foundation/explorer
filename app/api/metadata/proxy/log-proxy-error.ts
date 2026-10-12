import { Logger } from '@/app/shared/lib/logger';

import type { FetchedResource, ProxyErrorCode, StatusError } from './feature';

type LogPolicy = {
    // `error` logs the StatusError itself, for the proxy's own faults. Sentry receives it only with `sentry`.
    level: 'debug' | 'warn' | 'error';
    // Falls back to the error's own message when a code has no stable log message of its own.
    message?: string;
    // Oversize and unreachable upstreams are reported so their rate can tune the size cap and spot dead hosts.
    sentry?: true;
};

// Third-party failures are warnings at most; only the proxy's own faults are exceptions.
const LOG_POLICY: Record<ProxyErrorCode, LogPolicy> = {
    aborted: { level: 'debug' },
    // The body is already buffered, so a decode failure other than malformed JSON is the proxy's own fault.
    'decode-failed': { level: 'error', sentry: true },
    'malformed-json': { level: 'debug' },
    'non-http-protocol': { level: 'warn', message: 'Non-HTTP protocol blocked' },
    'oversize-declared': { level: 'warn', message: 'Resource exceeds max size (Content-Length)', sentry: true },
    'oversize-streamed': { level: 'warn', message: 'Resource exceeds max size (streamed)', sentry: true },
    'redirect-invalid-location': { level: 'warn', message: 'Redirect with invalid Location header' },
    'redirect-loop': { level: 'warn', message: 'Redirect loop detected' },
    'redirect-missing-location': { level: 'warn', message: 'Redirect without Location header' },
    'ssrf-blocked': { level: 'warn', message: 'Hostname resolution blocked (SSRF protection)' },
    timeout: { level: 'debug' },
    'too-many-redirects': { level: 'warn', message: 'Too many redirects' },
    'unlisted-upstream-status': { level: 'warn', message: 'Unlisted upstream status' },
    unreachable: { level: 'warn', message: 'Fetch failed', sentry: true },
    'unsupported-content-type': { level: 'debug' },
    'upstream-status': { level: 'warn', message: 'Upstream returned error' },
};

export function logProxyError(error: StatusError) {
    const { level, message = error.message, sentry } = LOG_POLICY[error.code];
    const context = sentry ? { ...error.context, sentry, sentryExtras: error.context } : error.context;
    if (level === 'error') {
        Logger.error(error, context);
        return;
    }
    Logger[level](`[api:metadata-proxy] ${message}`, context);
}

// Records the full fetched-size distribution, not just the over-cap tail, to tune `MAX_SIZE`.
export function logResourceFetched({ byteLength, headers, host }: FetchedResource, maxSize: number) {
    Logger.info('[api:metadata-proxy] Resource fetched', {
        byteLength,
        contentType: headers.get('content-type'),
        host,
        maxSize,
    });
}
