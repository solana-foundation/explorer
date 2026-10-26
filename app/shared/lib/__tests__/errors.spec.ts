import {
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__INVALID_PARAMS,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__RPC__INTEGER_OVERFLOW,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import {
    classifyTransientError,
    isRetryableError,
    isRetryableFetchError,
    isRpcMisconfigError,
    matchAbortError,
} from '../errors';

describe('isRetryableFetchError', () => {
    it('should match a transient code on the top-level error', () => {
        expect(
            isRetryableFetchError(Object.assign(new Error('Premature close'), { code: 'ERR_STREAM_PREMATURE_CLOSE' })),
        ).toBe(true);
        expect(isRetryableFetchError(Object.assign(new Error('reset'), { code: 'ECONNRESET' }))).toBe(true);
    });

    it('should match a transient code nested in the cause chain (undici "fetch failed")', () => {
        const error = Object.assign(new TypeError('fetch failed'), {
            cause: Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' }),
        });
        expect(isRetryableFetchError(error)).toBe(true);
    });

    it('should not match an error without a recognized code', () => {
        expect(isRetryableFetchError(new Error('boom'))).toBe(false);
        expect(isRetryableFetchError(Object.assign(new Error('nope'), { code: 'EACCES' }))).toBe(false);
    });

    // A DNS blip, an unreachable host and a reset connection all clear on their own. Left unrecognised,
    // each one is reported as an unclassified failure on every request that hits it.
    it.each([['EAI_AGAIN'], ['EHOSTUNREACH'], ['ENETUNREACH'], ['ECONNABORTED']])(
        'should match a %s connection failure',
        code => {
            const error = Object.assign(new TypeError('fetch failed'), {
                cause: Object.assign(new Error('connect'), { code }),
            });
            expect(isRetryableFetchError(error)).toBe(true);
        },
    );

    // Both need someone to fix a URL or a certificate, so neither may look like a blip that clears — they
    // fall through to the unclassified tier, which reports rather than warns.
    it.each([
        ['a hostname that does not resolve', 'ENOTFOUND'],
        ['a TLS handshake the client will not complete', 'EPROTO'],
    ])('should not match %s', (_reason, code) => {
        const error = Object.assign(new TypeError('fetch failed'), {
            cause: Object.assign(new Error('connect'), { code }),
        });
        expect(isRetryableFetchError(error)).toBe(false);
    });

    it('should not match non-error values', () => {
        expect(isRetryableFetchError('ECONNRESET')).toBe(false);
        expect(isRetryableFetchError(undefined)).toBe(false);
        expect(isRetryableFetchError({ code: 'ECONNRESET' })).toBe(false);
    });

    it('should terminate on a self-referential cause chain', () => {
        const error: Error & { cause?: unknown } = new Error('loop');
        error.cause = error;
        expect(isRetryableFetchError(error)).toBe(false);
    });
});

describe('classifyTransientError / isRetryableError', () => {
    const retryable = Object.assign(new Error('reset'), { code: 'ECONNRESET' });

    it('should classify a retryable connection error as retryable', () => {
        expect(classifyTransientError(retryable)).toBe('retryable');
        expect(isRetryableError(retryable)).toBe(true);
    });

    it('should return undefined / false for errors outside the classifier domain', () => {
        expect(classifyTransientError(new Error('boom'))).toBeUndefined();
        expect(isRetryableError(new Error('boom'))).toBe(false);
    });
});

describe('isRpcMisconfigError', () => {
    // Someone has to change configuration for these to stop, and until they do every visitor gets the
    // same refusal.
    it('should match a call the node does not serve', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, { __serverMessage: 'nope' });
        expect(isRpcMisconfigError(error)).toBe(true);
    });

    it('should match arguments the node rejects', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__INVALID_PARAMS, { __serverMessage: 'nope' });
        expect(isRpcMisconfigError(error)).toBe(true);
    });

    it.each([
        ['a rejected key', 403],
        ['an endpoint that is not there', 404],
        ['credentials the node will not take', 401],
    ])('should match %s', (_reason, statusCode) => {
        expect(isRpcMisconfigError(httpError(statusCode))).toBe(true);
    });

    // The two a classifier working by elimination gets wrong. Each is our own bug or a version skew, and
    // calling it someone else's configuration downgrades it from a report to a shrug — with the failed
    // response cached and served to everyone else.
    it('should not call a request body the node could not parse a misconfiguration', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__PARSE_ERROR, { __serverMessage: 'Parse error' });
        expect(isRpcMisconfigError(error)).toBe(false);
    });

    it('should not call a figure the client cannot represent a misconfiguration', () => {
        const error = new SolanaError(SOLANA_ERROR__RPC__INTEGER_OVERFLOW, {
            argumentLabel: 'value',
            keyPath: [],
            methodName: 'getSupply',
            optionalPathLabel: 'supply',
            value: 2n ** 64n,
        });
        expect(isRpcMisconfigError(error)).toBe(false);
    });

    it('should not match an overloaded node, which the transient tier owns', () => {
        const busy = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'busy' });

        expect(isRpcMisconfigError(busy)).toBe(false);
        expect(isRpcMisconfigError(httpError(429))).toBe(false);
    });

    function httpError(statusCode: number) {
        return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
            headers: new Headers(),
            message: `HTTP ${statusCode}`,
            statusCode,
        });
    }

    it('should not match a failure that is not an RPC error at all', () => {
        expect(isRpcMisconfigError(new Error('boom'))).toBe(false);
        expect(isRpcMisconfigError(new SyntaxError('Unexpected token <'))).toBe(false);
    });
});

describe('matchAbortError', () => {
    it('should match an AbortError by name', () => {
        expect(matchAbortError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(true);
    });

    it('should not match other errors', () => {
        expect(matchAbortError(new Error('nope'))).toBe(false);
        expect(matchAbortError('AbortError')).toBe(false);
    });
});
