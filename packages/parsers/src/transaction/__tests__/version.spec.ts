import { describe, expect, it } from 'vitest';

import { UnsupportedTransactionVersionError } from '../errors.js';
import { isV1MessageBytes, normalizeVersion } from '../version.js';

describe('isV1MessageBytes', () => {
    it('should report true for the v1 prefix', () => {
        expect(isV1MessageBytes(new Uint8Array([0x81, 0x00]))).toBe(true);
    });

    it('should report false for a v0 message, whose prefix is 0x80', () => {
        expect(isV1MessageBytes(new Uint8Array([0x80, 0x00]))).toBe(false);
    });

    it('should report false for a legacy message, which opens with its signer count', () => {
        expect(isV1MessageBytes(new Uint8Array([0x01, 0x00]))).toBe(false);
    });

    it('should report false for empty bytes', () => {
        expect(isV1MessageBytes(new Uint8Array())).toBe(false);
    });
});

describe('normalizeVersion', () => {
    it.each([
        ['legacy', 'legacy'],
        [0, 0],
        [1, 1],
        [0n, 0],
        [1n, 1],
    ] as const)('should accept %s', (version, expected) => {
        expect(normalizeVersion(version)).toBe(expected);
    });

    it.each([2, 2n, undefined])('should reject %s', version => {
        expect(() => normalizeVersion(version)).toThrow(UnsupportedTransactionVersionError);
    });

    it('should reject a null version', () => {
        // eslint-disable-next-line unicorn/no-null -- null stands for a response with no `version` field
        expect(() => normalizeVersion(null)).toThrow(UnsupportedTransactionVersionError);
    });
});
