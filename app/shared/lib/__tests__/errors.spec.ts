import { describe, expect, it } from 'vitest';

import { classifyTransientError, isRetryableError, isRetryableFetchError, matchAbortError } from '../errors';

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

describe('matchAbortError', () => {
    it('should match an AbortError by name', () => {
        expect(matchAbortError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(true);
    });

    it('should not match other errors', () => {
        expect(matchAbortError(new Error('nope'))).toBe(false);
        expect(matchAbortError('AbortError')).toBe(false);
    });
});
