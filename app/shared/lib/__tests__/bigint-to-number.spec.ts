import { describe, expect, it } from 'vitest';

import { withNumbersInsteadOfBigInts } from '../bigint-to-number';

describe('withNumbersInsteadOfBigInts', () => {
    it('should convert a bare bigint', () => {
        expect(withNumbersInsteadOfBigInts(7n)).toBe(7);
    });

    it('should leave other primitives untouched', () => {
        expect(withNumbersInsteadOfBigInts('AccountNotFound')).toBe('AccountNotFound');
        expect(withNumbersInsteadOfBigInts(3)).toBe(3);
        expect(withNumbersInsteadOfBigInts(true)).toBe(true);
        expect(withNumbersInsteadOfBigInts(null)).toBeNull();
        expect(withNumbersInsteadOfBigInts(undefined)).toBeUndefined();
    });

    it('should recurse through nested arrays and objects', () => {
        const err = { InstructionError: [2n, { Custom: 6001n }] };

        expect(withNumbersInsteadOfBigInts(err)).toStrictEqual({ InstructionError: [2, { Custom: 6001 }] });
    });

    it('should preserve nulls nested inside a payload', () => {
        expect(withNumbersInsteadOfBigInts({ confirmations: null, slot: 12n })).toStrictEqual({
            confirmations: null,
            slot: 12,
        });
    });

    it('should produce a JSON-serializable payload', () => {
        const converted = withNumbersInsteadOfBigInts({ InstructionError: [0n, { Custom: 1n }] });

        expect(() => JSON.stringify(converted)).not.toThrow();
    });

    it('should not be pointed at binary data: byte arrays are flattened into plain objects', () => {
        // Documents the plain-JSON-only restriction in the helper's docblock rather than endorsing it.
        expect(withNumbersInsteadOfBigInts(Uint8Array.from([1, 2]))).toStrictEqual({ 0: 1, 1: 2 });
    });
});
