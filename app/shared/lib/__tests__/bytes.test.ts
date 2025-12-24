import BN from 'bn.js';
import { describe, expect, it } from 'vitest';

import {
    alloc,
    bnToBytes,
    bytes,
    bytesToBn,
    concat,
    equals,
    fromBase64,
    fromHex,
    fromUtf8,
    isByteArray,
    isValidBase64,
    toBase64,
    toHex,
    toUint8Array,
    toUtf8,
} from '../bytes';

describe('bytes helpers', () => {
    describe('Base64 encoding/decoding', () => {
        it('should decode base64 to bytes', () => {
            const input = 'SGVsbG8gV29ybGQ='; // "Hello World"
            const result = fromBase64(input);
            expect(Array.from(result)).toEqual([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]);
        });

        it('should encode bytes to base64', () => {
            const input = new Uint8Array([72, 101, 108, 108, 111]);
            expect(toBase64(input)).toBe('SGVsbG8=');
        });

        it('should handle empty input', () => {
            expect(fromBase64('').length).toBe(0);
            expect(toBase64(new Uint8Array([]))).toBe('');
        });

        it('should handle binary data with all byte values', () => {
            const allBytes = Array.from({ length: 256 }, (_, i) => i);
            const bytes = new Uint8Array(allBytes);
            const base64 = toBase64(bytes);
            const decoded = fromBase64(base64);
            expect(Array.from(decoded)).toEqual(allBytes);
        });

        it('should match Buffer behavior for base64', () => {
            const testCases = ['Hello', 'Test123!@#', ''];
            for (const str of testCases) {
                const bufferBase64 = Buffer.from(str).toString('base64');
                const helperBase64 = toBase64(fromUtf8(str));
                expect(helperBase64).toBe(bufferBase64);
            }
        });
    });

    describe('Hex encoding/decoding', () => {
        it('should decode hex to bytes', () => {
            const result = fromHex('1d9acb512ea545e4');
            expect(Array.from(result)).toEqual([29, 154, 203, 81, 46, 165, 69, 228]);
        });

        it('should encode bytes to hex', () => {
            const input = new Uint8Array([255, 0, 127, 128]);
            expect(toHex(input)).toBe('ff007f80');
        });

        it('should handle 0x prefix', () => {
            const result = fromHex('0xff00');
            expect(Array.from(result)).toEqual([255, 0]);
        });

        it('should handle empty hex', () => {
            expect(fromHex('').length).toBe(0);
            expect(fromHex('0x').length).toBe(0);
        });

        it('should match Buffer behavior for hex', () => {
            const testHex = '1d9acb512ea545e4';
            const bufferResult = Buffer.from(testHex, 'hex');
            const helperResult = fromHex(testHex);
            expect(Array.from(helperResult)).toEqual(Array.from(bufferResult));
        });
    });

    describe('UTF-8 encoding/decoding', () => {
        it('should encode utf8 string', () => {
            const result = fromUtf8('Hello');
            expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
        });

        it('should decode utf8 bytes', () => {
            const input = new Uint8Array([72, 101, 108, 108, 111]);
            expect(toUtf8(input)).toBe('Hello');
        });

        it('should handle unicode characters', () => {
            const input = 'Hello 世界 🚀';
            const bytes = fromUtf8(input);
            expect(toUtf8(bytes)).toBe(input);
        });

        it('should match Buffer behavior for utf8', () => {
            const testStr = 'Hello 世界 🚀';
            const bufferBytes = Buffer.from(testStr, 'utf-8');
            const helperBytes = fromUtf8(testStr);
            expect(Array.from(helperBytes)).toEqual(Array.from(bufferBytes));
        });
    });

    describe('alloc', () => {
        it('should create zero-filled array', () => {
            const result = alloc(5);
            expect(Array.from(result)).toEqual([0, 0, 0, 0, 0]);
        });

        it('should create empty array for size 0', () => {
            const result = alloc(0);
            expect(result.length).toBe(0);
        });

        it('should match Buffer.alloc behavior', () => {
            const sizes = [0, 1, 5, 100];
            for (const size of sizes) {
                const bufferResult = Buffer.alloc(size);
                const helperResult = alloc(size);
                expect(Array.from(helperResult)).toEqual(Array.from(bufferResult));
            }
        });
    });

    describe('concat', () => {
        it('should concatenate arrays', () => {
            const a = new Uint8Array([1, 2]);
            const b = new Uint8Array([3, 4]);
            const result = concat([a, b]);
            expect(Array.from(result)).toEqual([1, 2, 3, 4]);
        });

        it('should handle empty arrays', () => {
            const result = concat([]);
            expect(result.length).toBe(0);
        });

        it('should handle single array', () => {
            const a = new Uint8Array([1, 2, 3]);
            const result = concat([a]);
            expect(Array.from(result)).toEqual([1, 2, 3]);
        });

        it('should handle arrays with empty elements', () => {
            const a = new Uint8Array([1, 2]);
            const b = new Uint8Array([]);
            const c = new Uint8Array([3]);
            const result = concat([a, b, c]);
            expect(Array.from(result)).toEqual([1, 2, 3]);
        });

        it('should match Buffer.concat behavior', () => {
            const a = new Uint8Array([1, 2]);
            const b = new Uint8Array([3, 4]);
            const bufferResult = Buffer.concat([Buffer.from(a), Buffer.from(b)]);
            const helperResult = concat([a, b]);
            expect(Array.from(helperResult)).toEqual(Array.from(bufferResult));
        });
    });

    describe('equals', () => {
        it('should return true for equal arrays', () => {
            const a = new Uint8Array([1, 2, 3]);
            const b = new Uint8Array([1, 2, 3]);
            expect(equals(a, b)).toBe(true);
        });

        it('should return false for different arrays', () => {
            const a = new Uint8Array([1, 2, 3]);
            const b = new Uint8Array([1, 2, 4]);
            expect(equals(a, b)).toBe(false);
        });

        it('should return false for different lengths', () => {
            const a = new Uint8Array([1, 2, 3]);
            const b = new Uint8Array([1, 2]);
            expect(equals(a, b)).toBe(false);
        });

        it('should return true for same reference', () => {
            const a = new Uint8Array([1, 2, 3]);
            expect(equals(a, a)).toBe(true);
        });

        it('should return true for empty arrays', () => {
            const a = new Uint8Array([]);
            const b = new Uint8Array([]);
            expect(equals(a, b)).toBe(true);
        });

        it('should match Buffer.equals behavior', () => {
            const testCases = [
                [
                    [1, 2, 3],
                    [1, 2, 3],
                ],
                [
                    [1, 2, 3],
                    [1, 2, 4],
                ],
                [
                    [1, 2],
                    [1, 2, 3],
                ],
                [[], []],
            ] as const;

            for (const [aArr, bArr] of testCases) {
                const bufA = Buffer.from(aArr);
                const bufB = Buffer.from(bArr);
                const uint8A = new Uint8Array(aArr);
                const uint8B = new Uint8Array(bArr);
                expect(equals(uint8A, uint8B)).toBe(bufA.equals(bufB));
            }
        });
    });

    describe('bnToBytes', () => {
        it('should convert BN to little-endian bytes', () => {
            const bn = new BN(256);
            const result = bnToBytes(bn, 'le', 2);
            expect(Array.from(result)).toEqual([0, 1]);
        });

        it('should convert BN to big-endian bytes', () => {
            const bn = new BN(256);
            const result = bnToBytes(bn, 'be', 2);
            expect(Array.from(result)).toEqual([1, 0]);
        });

        it('should pad to specified size', () => {
            const bn = new BN(1);
            const result = bnToBytes(bn, 'le', 8);
            expect(Array.from(result)).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
        });

        it('should handle max u64', () => {
            const bn = new BN('18446744073709551615');
            const result = bnToBytes(bn, 'le', 8);
            expect(Array.from(result)).toEqual([255, 255, 255, 255, 255, 255, 255, 255]);
        });

        it('should match bn.toArrayLike(Buffer) behavior', () => {
            const testCases = [
                { endian: 'le' as const, size: 2, value: '256' },
                { endian: 'be' as const, size: 2, value: '256' },
                { endian: 'le' as const, size: 8, value: '1' },
                { endian: 'le' as const, size: 4, value: '16777216' },
            ];

            for (const { value, endian, size } of testCases) {
                const bn = new BN(value);
                const bufferResult = bn.toArrayLike(Buffer, endian, size);
                const helperResult = bnToBytes(bn, endian, size);
                expect(Array.from(helperResult)).toEqual(Array.from(bufferResult));
            }
        });
    });

    describe('bytesToBn', () => {
        it('should convert little-endian bytes to BN', () => {
            const bytes = new Uint8Array([0, 1]); // 256 in LE
            const result = bytesToBn(BN, bytes, 'le');
            expect(result.toNumber()).toBe(256);
        });

        it('should convert big-endian bytes to BN', () => {
            const bytes = new Uint8Array([1, 0]); // 256 in BE
            const result = bytesToBn(BN, bytes, 'be');
            expect(result.toNumber()).toBe(256);
        });
    });

    describe('isValidBase64', () => {
        it('should return true for valid base64', () => {
            expect(isValidBase64('SGVsbG8=')).toBe(true);
            expect(isValidBase64('SGVsbG8gV29ybGQ=')).toBe(true);
            expect(isValidBase64('')).toBe(false); // Empty is not valid
        });

        it('should return false for invalid base64', () => {
            expect(isValidBase64('Hello World!')).toBe(false);
            expect(isValidBase64('Invalid@#$')).toBe(false);
        });

        it('should return false for non-strings', () => {
            expect(isValidBase64(null as any)).toBe(false);
            expect(isValidBase64(undefined as any)).toBe(false);
            expect(isValidBase64(123 as any)).toBe(false);
        });
    });

    describe('isByteArray', () => {
        it('should return true for Uint8Array', () => {
            expect(isByteArray(new Uint8Array([1, 2, 3]))).toBe(true);
        });

        it('should return true for Buffer', () => {
            expect(isByteArray(Buffer.from([1, 2, 3]))).toBe(true);
        });

        it('should return false for other types', () => {
            expect(isByteArray([1, 2, 3])).toBe(false);
            expect(isByteArray('hello')).toBe(false);
            expect(isByteArray(null)).toBe(false);
            expect(isByteArray(undefined)).toBe(false);
        });
    });

    describe('toUint8Array', () => {
        it('should return same array for pure Uint8Array', () => {
            const arr = new Uint8Array([1, 2, 3]);
            const result = toUint8Array(arr);
            expect(result).toBe(arr); // Same reference
        });

        it('should convert Buffer to Uint8Array', () => {
            const buf = Buffer.from([1, 2, 3]);
            const result = toUint8Array(buf);
            expect(result.constructor).toBe(Uint8Array);
            expect(Array.from(result)).toEqual([1, 2, 3]);
        });
    });

    describe('bytes()', () => {
        describe('string input', () => {
            it('should encode string as UTF-8 by default', () => {
                const result = bytes('hello');
                expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
                // Verify it matches Buffer.from behavior
                expect(Array.from(result)).toEqual(Array.from(Buffer.from('hello')));
            });

            it('should encode string as UTF-8 with explicit encoding', () => {
                const result = bytes('hello', 'utf8');
                expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
            });

            it('should decode hex string', () => {
                const result = bytes('deadbeef', 'hex');
                expect(Array.from(result)).toEqual([0xde, 0xad, 0xbe, 0xef]);
                // Verify it matches Buffer.from behavior
                expect(Array.from(result)).toEqual(Array.from(Buffer.from('deadbeef', 'hex')));
            });

            it('should decode base64 string', () => {
                const result = bytes('SGVsbG8=', 'base64');
                expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
                // Verify it matches Buffer.from behavior
                expect(Array.from(result)).toEqual(Array.from(Buffer.from('SGVsbG8=', 'base64')));
            });

            it('should handle unicode strings', () => {
                const result = bytes('Hello 世界');
                expect(Array.from(result)).toEqual(Array.from(Buffer.from('Hello 世界')));
            });

            it('should handle empty string', () => {
                const result = bytes('');
                expect(result.length).toBe(0);
            });
        });

        describe('array input', () => {
            it('should create from number array', () => {
                const result = bytes([1, 2, 3, 255]);
                expect(Array.from(result)).toEqual([1, 2, 3, 255]);
                // Verify it matches Buffer.from behavior
                expect(Array.from(result)).toEqual(Array.from(Buffer.from([1, 2, 3, 255])));
            });

            it('should handle empty array', () => {
                const result = bytes([]);
                expect(result.length).toBe(0);
            });
        });

        describe('Uint8Array input', () => {
            it('should create a copy of Uint8Array', () => {
                const original = new Uint8Array([1, 2, 3]);
                const result = bytes(original);
                expect(Array.from(result)).toEqual([1, 2, 3]);
                // Should be a copy, not the same reference
                expect(result).not.toBe(original);
            });
        });

        describe('ArrayBuffer input', () => {
            it('should create from ArrayBuffer', () => {
                const buffer = new ArrayBuffer(4);
                const view = new Uint8Array(buffer);
                view.set([10, 20, 30, 40]);

                const result = bytes(buffer);
                expect(Array.from(result)).toEqual([10, 20, 30, 40]);
            });
        });

        describe('Buffer.from parity', () => {
            it('should match Buffer.from for all common cases', () => {
                // String without encoding
                expect(Array.from(bytes('test'))).toEqual(Array.from(Buffer.from('test')));

                // String with utf8
                expect(Array.from(bytes('test', 'utf8'))).toEqual(Array.from(Buffer.from('test', 'utf8')));

                // Hex
                expect(Array.from(bytes('0102ff', 'hex'))).toEqual(Array.from(Buffer.from('0102ff', 'hex')));

                // Base64
                expect(Array.from(bytes('dGVzdA==', 'base64'))).toEqual(Array.from(Buffer.from('dGVzdA==', 'base64')));

                // Array
                expect(Array.from(bytes([0, 127, 255]))).toEqual(Array.from(Buffer.from([0, 127, 255])));
            });
        });
    });
});
