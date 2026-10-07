import { describe, expect, it } from 'vitest';

import {
    InvalidTransactionConfigError,
    MalformedTransactionError,
    UnsupportedTransactionVersionError,
} from '../errors.js';

describe('UnsupportedTransactionVersionError', () => {
    it('should carry the rejected version', () => {
        const error = new UnsupportedTransactionVersionError(2);

        expect(error.version).toBe(2);
        expect(error.name).toBe('UnsupportedTransactionVersionError');
        expect(error.message).toContain('2');
    });
});

describe('MalformedTransactionError', () => {
    it('should carry the underlying error as its cause', () => {
        const cause = new Error('decoder failure');
        const error = new MalformedTransactionError('Transaction could not be decoded.', { cause });

        expect(error.name).toBe('MalformedTransactionError');
        expect(error.message).toBe('Transaction could not be decoded.');
        expect(error.cause).toBe(cause);
    });
});

describe('InvalidTransactionConfigError', () => {
    it('should be a malformed transaction error that carries its cause', () => {
        const cause = new Error('mask failure');
        const error = new InvalidTransactionConfigError('Invalid transaction config mask: 1.', { cause });

        expect(error).toBeInstanceOf(MalformedTransactionError);
        expect(error.name).toBe('InvalidTransactionConfigError');
        expect(error.message).toBe('Invalid transaction config mask: 1.');
        expect(error.cause).toBe(cause);
    });
});
