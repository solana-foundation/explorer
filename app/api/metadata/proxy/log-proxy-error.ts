import { Logger } from '@/app/shared/lib/logger';

import type { FetchedResource, ProxyErrorCode, StatusError } from './feature';

type LogPolicy = {
    level: 'debug' | 'warn';
    // Falls back to the error's own message when a code has no stable log message of its own.
    message?: string;
    // Oversize and unreachable upstreams are reported so their rate can tune the size cap and spot dead hosts.
    sentry?: true;
};

// Expected third-party failures: warnings at most, never exceptions.
const LOG_POLICY: Record<ProxyErrorCode, LogPolicy> = {
    aborted: { level: 'debug' },
    'decode-failed': { level: 'warn' },
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
    // TODO(<ticket>): report to Sentry (sentry: true) once unlisted statuses are tracked there
    'unlisted-upstream-status': { level: 'warn', message: 'Unlisted upstream status' },
    unreachable: { level: 'warn', message: 'Fetch failed', sentry: true },
    'unsupported-content-type': { level: 'debug' },
    'upstream-status': { level: 'warn', message: 'Upstream returned error' },
};

export function logProxyError(error: StatusError) {
    const { level, message = error.message, sentry } = LOG_POLICY[error.code];
    const context = sentry ? { ...error.context, sentry, sentryExtras: error.context } : error.context;
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
