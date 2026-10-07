import { describe, expect, it } from 'vitest';

import { isV1MessageBytes } from '../version.js';

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
