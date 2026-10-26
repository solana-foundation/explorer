import { isTransientRpcError } from '@solana/idl';
import {
    isSolanaError,
    SOLANA_ERROR__JSON_RPC__INVALID_PARAMS,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
} from '@solana/kit';

export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}

// Transient connection-level fetch failures, matched by structured `code` (stable; messages vary by undici/locale).
// A name that stops resolving (`ENOTFOUND`) and a TLS handshake a client will not complete (`EPROTO`) are
// left out: both need someone to act, so they belong with the failures that get reported.
const RETRYABLE_FETCH_ERROR_CODES = new Set([
    'ERR_STREAM_PREMATURE_CLOSE',
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ECONNABORTED',
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

/**
 * An RPC failure retrying will not fix: a method the node does not serve, a rejected key, a bad URL.
 * Someone has to change configuration, and until they do it fails the same way for everyone.
 *
 * Matched code by code rather than by elimination, so a request the node could not parse and a figure
 * the client could not read stay ours instead of being filed under someone else's configuration.
 */
export function isRpcMisconfigError(error: unknown): boolean {
    if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) {
        const { statusCode } = error.context;
        return statusCode >= 400 && statusCode < 500 && statusCode !== 429;
    }
    return (
        isSolanaError(error, SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND) ||
        isSolanaError(error, SOLANA_ERROR__JSON_RPC__INVALID_PARAMS)
    );
}
