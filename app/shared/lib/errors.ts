import { isTransientRpcError } from '@solana/idl';

export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}

// Transient connection-level fetch failures, matched by structured `code` (stable; messages vary by undici/locale).
const RETRYABLE_FETCH_ERROR_CODES = new Set([
    'ERR_STREAM_PREMATURE_CLOSE',
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ETIMEDOUT',
    'UND_ERR_SOCKET',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
]);

export function isRetryableFetchError(error: unknown): boolean {
    // undici nests the real failure as `cause` under `TypeError: fetch failed`; walk the chain.
    for (
        let current: unknown = error, depth = 0;
        current instanceof Error && depth < 5;
        current = current.cause, depth++
    ) {
        const code = (current as { code?: unknown }).code;
        if (typeof code === 'string' && RETRYABLE_FETCH_ERROR_CODES.has(code)) return true;
    }
    return false;
}

export type ErrorDisposition = 'retryable' | 'fatal';

// `undefined` = outside this classifier's domain, so classifiers compose (first defined wins) as more are added.
export type ErrorClassifier = (error: unknown) => ErrorDisposition | undefined;

export const classifyTransientError: ErrorClassifier = error =>
    isTransientRpcError(error) || isRetryableFetchError(error) ? 'retryable' : undefined;

// Keeps the disposition literal in-module so callers don't compare strings.
export function isRetryableError(error: unknown): boolean {
    return classifyTransientError(error) === 'retryable';
}
