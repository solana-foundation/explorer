import {
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { asJsonRpcError, isMethodNotFound } from '../rpc-errors';

describe('isMethodNotFound', () => {
    it('should recognise the standard JSON-RPC method-not-found code', () => {
        expect(isMethodNotFound({ code: -32601, message: 'Method not found' })).toBe(true);
    });

    it('should not classify another structured error code as method-not-found', () => {
        // A numeric code is authoritative: a proxy error page whose message happens to say
        // "method not found" must not get an endpoint written off as too old.
        expect(isMethodNotFound({ code: -32000, message: 'method not found' })).toBe(false);
    });

    it('should recognise an unknown method reported as a generic internal error', () => {
        // Helius answers an unknown method with -32603 rather than -32601, putting the real
        // reason in the message. Without this, every caller reads that endpoint as failing.
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

describe('asJsonRpcError', () => {
    it('should read the code and node message from a JSON-RPC SolanaError', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, {
            __serverMessage: 'Method not found',
        });

        expect(asJsonRpcError(error)).toEqual({ code: -32601, message: 'Method not found' });
    });

    it('should keep the node message of an internal error so isMethodNotFound can read it', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, {
            __serverMessage: 'Unsupported method: getProgramAccounts',
        });

        expect(isMethodNotFound(asJsonRpcError(error))).toBe(true);
    });

    it('should return the kit error code and no message for a SolanaError that is not a JSON-RPC error', () => {
        const error = new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
            headers: new Headers(),
            message: 'Not Found',
            statusCode: 404,
        });

        expect(asJsonRpcError(error)).toEqual({ code: SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, message: undefined });
    });

    it('should return undefined for an error that is not a SolanaError', () => {
        expect(asJsonRpcError(new Error('Method not found'))).toBeUndefined();
        expect(asJsonRpcError({ code: -32601, message: 'Method not found' })).toBeUndefined();
        expect(asJsonRpcError(undefined)).toBeUndefined();
    });
});
