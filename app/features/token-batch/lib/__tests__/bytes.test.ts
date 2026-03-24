import { describe, expect, it } from 'vitest';

import { concatBytes, readU8, readU64LE, writeU64LE } from '../bytes';

describe('concatBytes', () => {
    it('should return empty array for no arguments', () => {
        expect(concatBytes()).toEqual(new Uint8Array([]));
    });

    it('should return a copy of a single array', () => {
        const input = new Uint8Array([1, 2, 3]);
        const result = concatBytes(input);
        expect(result).toEqual(input);
        expect(result).not.toBe(input);
    });

    it('should concatenate multiple arrays', () => {
        const result = concatBytes(new Uint8Array([1, 2]), new Uint8Array([3]), new Uint8Array([4, 5, 6]));
        expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });

    it('should handle empty arrays in the mix', () => {
        const result = concatBytes(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([]));
        expect(result).toEqual(new Uint8Array([1]));
    });
});

describe('writeU64LE / readU64LE', () => {
    it('should round-trip zero', () => {
        const bytes = writeU64LE(0n);
        expect(bytes.length).toBe(8);
        expect(readU64LE(bytes, 0)).toBe(0n);
    });

    it('should round-trip a small value', () => {
        const value = 42000n;
        expect(readU64LE(writeU64LE(value), 0)).toBe(value);
    });

    it('should round-trip max u64', () => {
        const max = 2n ** 64n - 1n;
        expect(readU64LE(writeU64LE(max), 0)).toBe(max);
    });

    it('should write in little-endian order', () => {
        const bytes = writeU64LE(1n);
        expect(bytes[0]).toBe(1);
        expect(bytes[7]).toBe(0);
    });

    it('should read at an offset', () => {
        const prefix = new Uint8Array([0xff]);
        const data = concatBytes(prefix, writeU64LE(999n));
        expect(readU64LE(data, 1)).toBe(999n);
    });

    it('should throw RangeError when data is too short', () => {
        expect(() => readU64LE(new Uint8Array([1, 2, 3]), 0)).toThrow(RangeError);
    });

    it('should throw RangeError when offset exceeds length', () => {
        expect(() => readU64LE(new Uint8Array(8), 8)).toThrow(RangeError);
    });
});

describe('readU8', () => {
    it('should read a byte at offset', () => {
        expect(readU8(new Uint8Array([10, 20, 30]), 1)).toBe(20);
    });

    it('should throw RangeError when offset is out of bounds', () => {
        expect(() => readU8(new Uint8Array([1]), 1)).toThrow(RangeError);
    });

    it('should throw RangeError for empty array', () => {
        expect(() => readU8(new Uint8Array([]), 0)).toThrow(RangeError);
    });
});
