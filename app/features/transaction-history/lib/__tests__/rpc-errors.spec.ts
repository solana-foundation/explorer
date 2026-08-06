import { describe, expect, it } from 'vitest';

import { isMethodNotFound } from '../rpc-errors';

describe('isMethodNotFound', () => {
    it('should recognise the standard JSON-RPC method-not-found code', () => {
        expect(isMethodNotFound({ code: -32601, message: 'Method not found' })).toBe(true);
    });

    it('should not classify another structured error code as method-not-found', () => {
        // A numeric code is authoritative: a proxy error page whose message happens to say
        // "method not found" must not permanently disable filtering for the session.
        expect(isMethodNotFound({ code: -32000, message: 'method not found' })).toBe(false);
    });

    it('should recognise an unknown method reported as a generic internal error', () => {
        // Helius answers an unknown method with -32603 rather than -32601, putting the real
        // reason in the message. Without this the getSignaturesForAddress fallback never fires.
        expect(isMethodNotFound({ code: -32603, message: 'Method not found' })).toBe(true);
    });

    it('should not treat every internal error as method-not-found', () => {
        // Same endpoint, same code, genuinely different failure: a slot bound below the
        // index floor. This must surface as an error, not silently fall back.
        expect(isMethodNotFound({ code: -32603, message: 'Slot <= 460000000 not found' })).toBe(false);
        expect(isMethodNotFound({ code: -32603, message: 'Internal error' })).toBe(false);
    });

    it('should fall back to the message when no numeric code is present', () => {
        expect(isMethodNotFound(new Error('Method not found'))).toBe(true);
        expect(isMethodNotFound(new Error('Unsupported method: getTransactionsForAddress'))).toBe(true);
    });

    it('should reject unrelated errors and non-error values', () => {
        expect(isMethodNotFound(new Error('request timed out'))).toBe(false);
        expect(isMethodNotFound(undefined)).toBe(false);
        expect(isMethodNotFound('boom')).toBe(false);
    });
});
