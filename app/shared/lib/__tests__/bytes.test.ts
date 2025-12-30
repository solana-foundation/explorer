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

// Shared test data for base64 encoding/decoding
const base64TestCases: Record<string, number[]> = {
    'SGVsbG8=': [72, 101, 108, 108, 111], // "Hello"
    'SGVsbG8gV29ybGQ=': [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100], // "Hello World"
    'dGVzdA==': [116, 101, 115, 116], // "test"
    '': [], // empty
};

// All 256 byte values for binary data tests
const allByteValues = Array.from({ length: 256 }, (_, i) => i);
const allByteValuesBase64 = btoa(String.fromCharCode(...new Uint8Array(allByteValues)));

// Shared test data for hex encoding/decoding
const hexTestCases: Record<string, number[]> = {
    '1d9acb512ea545e4': [29, 154, 203, 81, 46, 165, 69, 228],
    ff007f80: [255, 0, 127, 128],
    deadbeef: [222, 173, 190, 239],
    '': [],
};

// All 256 byte values as hex string
const allByteValuesHex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')).join('');

// Shared test data for UTF-8 encoding/decoding
const utf8TestCases: Record<string, number[]> = {
    Hello: [72, 101, 108, 108, 111],
    'Hello World': [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100],
    '': [],
    世界: [228, 184, 150, 231, 149, 140], // Chinese characters
    '🚀': [240, 159, 154, 128], // Emoji (4-byte UTF-8)
};

describe('bytes helpers', () => {
    describe('Base64', () => {
        describe('fromBase64', () => {
            it.each(Object.entries(base64TestCases))('should decode "%s"', (base64, expected) => {
                const result = fromBase64(base64);
                expect(Array.from(result)).toEqual(expected);
            });

            it('should match Buffer.from behavior', () => {
                for (const [base64, expected] of Object.entries(base64TestCases)) {
                    const result = fromBase64(base64);
                    const bufferResult = Buffer.from(base64, 'base64');
                    expect(Array.from(result)).toEqual(expected);
                    expect(Array.from(result)).toEqual(Array.from(bufferResult));
                }
            });

            describe('fallback using atob', () => {
                // @ts-expect-error Intentionally accessing non-standard property for testing
                const originalFromBase64 = Uint8Array['fromBase64'];

                beforeEach(() => {
                    // @ts-expect-error Intentionally deleting to force fallback path
                    delete Uint8Array['fromBase64'];
                });

                afterEach(() => {
                    if (originalFromBase64) {
                        // @ts-expect-error Intentionally restoring non-standard property
                        Uint8Array['fromBase64'] = originalFromBase64;
                    }
                });

                it.each(Object.entries(base64TestCases))('should decode "%s" using atob', (base64, expected) => {
                    const result = fromBase64(base64);
                    const bufferResult = Buffer.from(base64, 'base64');
                    expect(Array.from(result)).toEqual(expected);
                    expect(Array.from(result)).toEqual(Array.from(bufferResult));
                });

                it('should handle binary data with all byte values', () => {
                    const decoded = fromBase64(allByteValuesBase64);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });

            describe('native Uint8Array.fromBase64', () => {
                const hasNative = 'fromBase64' in Uint8Array;

                it.runIf(hasNative).each(Object.entries(base64TestCases))(
                    'should decode "%s" using native',
                    (base64, expected) => {
                        const result = fromBase64(base64);
                        const bufferResult = Buffer.from(base64, 'base64');
                        expect(Array.from(result)).toEqual(expected);
                        expect(Array.from(result)).toEqual(Array.from(bufferResult));
                    }
                );

                it.runIf(hasNative)('should handle binary data with all byte values', () => {
                    const decoded = fromBase64(allByteValuesBase64);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });
        });

        describe('toBase64', () => {
            it.each(Object.entries(base64TestCases))('should encode to "%s"', (expected, input) => {
                const result = toBase64(new Uint8Array(input));
                expect(result).toBe(expected);
            });

            it('should match Buffer.toString behavior', () => {
                for (const [expected, input] of Object.entries(base64TestCases)) {
                    const result = toBase64(new Uint8Array(input));
                    const bufferResult = Buffer.from(input).toString('base64');
                    expect(result).toBe(expected);
                    expect(result).toBe(bufferResult);
                }
            });

            it('should handle binary data with all byte values', () => {
                const input = new Uint8Array(allByteValues);
                const base64 = toBase64(input);
                expect(base64).toBe(allByteValuesBase64);
            });

            describe('fallback using btoa', () => {
                // @ts-expect-error Intentionally accessing non-standard property for testing
                const originalToBase64 = Uint8Array.prototype['toBase64'];

                beforeEach(() => {
                    // @ts-expect-error Intentionally deleting to force fallback path
                    delete Uint8Array.prototype['toBase64'];
                });

                afterEach(() => {
                    if (originalToBase64) {
                        // @ts-expect-error Intentionally restoring non-standard property
                        Uint8Array.prototype['toBase64'] = originalToBase64;
                    }
                });

                it.each(Object.entries(base64TestCases))('should encode to "%s" using btoa', (expected, input) => {
                    const result = toBase64(new Uint8Array(input));
                    const bufferResult = Buffer.from(input).toString('base64');
                    expect(result).toBe(expected);
                    expect(result).toBe(bufferResult);
                });

                it('should handle binary data with all byte values', () => {
                    const input = new Uint8Array(allByteValues);
                    const base64 = toBase64(input);
                    const decoded = fromBase64(base64);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });

            describe('native Uint8Array.prototype.toBase64', () => {
                const hasNative = 'toBase64' in Uint8Array.prototype;

                it.runIf(hasNative).each(Object.entries(base64TestCases))(
                    'should encode to "%s" using native',
                    (expected, input) => {
                        const result = toBase64(new Uint8Array(input));
                        const bufferResult = Buffer.from(input).toString('base64');
                        expect(result).toBe(expected);
                        expect(result).toBe(bufferResult);
                    }
                );

                it.runIf(hasNative)('should handle binary data with all byte values', () => {
                    const input = new Uint8Array(allByteValues);
                    const base64 = toBase64(input);
                    expect(base64).toBe(allByteValuesBase64);
                });
            });
        });
    });

    describe('Hex', () => {
        describe('fromHex', () => {
            it.each(Object.entries(hexTestCases))('should decode "%s"', (hex, expected) => {
                const result = fromHex(hex);
                expect(Array.from(result)).toEqual(expected);
            });

            it.each(Object.entries(hexTestCases))(
                'should decode "0x%s" with prefix to same result',
                (hex, expected) => {
                    const withoutPrefix = fromHex(hex);
                    const withPrefix = fromHex(`0x${hex}`);
                    expect(Array.from(withoutPrefix)).toEqual(expected);
                    expect(Array.from(withPrefix)).toEqual(expected);
                    expect(Array.from(withPrefix)).toEqual(Array.from(withoutPrefix));
                }
            );

            it('should match Buffer.from behavior', () => {
                for (const [hex, expected] of Object.entries(hexTestCases)) {
                    const result = fromHex(hex);
                    const bufferResult = Buffer.from(hex, 'hex');
                    expect(Array.from(result)).toEqual(expected);
                    expect(Array.from(result)).toEqual(Array.from(bufferResult));
                }
            });

            describe('fallback', () => {
                // @ts-expect-error Intentionally accessing non-standard property for testing
                const originalFromHex = Uint8Array['fromHex'];

                beforeEach(() => {
                    // @ts-expect-error Intentionally deleting to force fallback path
                    delete Uint8Array['fromHex'];
                });

                afterEach(() => {
                    if (originalFromHex) {
                        // @ts-expect-error Intentionally restoring non-standard property
                        Uint8Array['fromHex'] = originalFromHex;
                    }
                });

                it.each(Object.entries(hexTestCases))('should decode "%s" using fallback', (hex, expected) => {
                    const result = fromHex(hex);
                    expect(Array.from(result)).toEqual(expected);
                });

                it('should handle binary data with all byte values', () => {
                    const decoded = fromHex(allByteValuesHex);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });

            describe('native Uint8Array.fromHex', () => {
                const hasNative = 'fromHex' in Uint8Array;

                it.runIf(hasNative).each(Object.entries(hexTestCases))(
                    'should decode "%s" using native',
                    (hex, expected) => {
                        const result = fromHex(hex);
                        expect(Array.from(result)).toEqual(expected);
                    }
                );

                it.runIf(hasNative)('should handle binary data with all byte values', () => {
                    const decoded = fromHex(allByteValuesHex);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });
        });

        describe('toHex', () => {
            it.each(Object.entries(hexTestCases))('should encode to "%s"', (expected, input) => {
                const result = toHex(new Uint8Array(input));
                expect(result).toBe(expected);
            });

            it('should match Buffer.toString behavior', () => {
                for (const [expected, input] of Object.entries(hexTestCases)) {
                    const result = toHex(new Uint8Array(input));
                    const bufferResult = Buffer.from(input).toString('hex');
                    expect(result).toBe(expected);
                    expect(result).toBe(bufferResult);
                }
            });

            it('should handle binary data with all byte values', () => {
                const input = new Uint8Array(allByteValues);
                const hex = toHex(input);
                expect(hex).toBe(allByteValuesHex);
            });

            describe('fallback', () => {
                // @ts-expect-error Intentionally accessing non-standard property for testing
                const originalToHex = Uint8Array.prototype['toHex'];

                beforeEach(() => {
                    // @ts-expect-error Intentionally deleting to force fallback path
                    delete Uint8Array.prototype['toHex'];
                });

                afterEach(() => {
                    if (originalToHex) {
                        // @ts-expect-error Intentionally restoring non-standard property
                        Uint8Array.prototype['toHex'] = originalToHex;
                    }
                });

                it.each(Object.entries(hexTestCases))('should encode to "%s" using fallback', (expected, input) => {
                    const result = toHex(new Uint8Array(input));
                    expect(result).toBe(expected);
                });

                it('should handle binary data with all byte values', () => {
                    const input = new Uint8Array(allByteValues);
                    const hex = toHex(input);
                    const decoded = fromHex(hex);
                    expect(Array.from(decoded)).toEqual(allByteValues);
                });
            });

            describe('native Uint8Array.prototype.toHex', () => {
                const hasNative = 'toHex' in Uint8Array.prototype;

                it.runIf(hasNative).each(Object.entries(hexTestCases))(
                    'should encode to "%s" using native',
                    (expected, input) => {
                        const result = toHex(new Uint8Array(input));
                        expect(result).toBe(expected);
                    }
                );

                it.runIf(hasNative)('should handle binary data with all byte values', () => {
                    const input = new Uint8Array(allByteValues);
                    const hex = toHex(input);
                    expect(hex).toBe(allByteValuesHex);
                });
            });
        });
    });

    describe('UTF-8', () => {
        describe('fromUtf8', () => {
            it.each(Object.entries(utf8TestCases))('should encode "%s"', (str, expected) => {
                const result = fromUtf8(str);
                expect(Array.from(result)).toEqual(expected);
            });

            it('should match Buffer.from behavior', () => {
                for (const [str, expected] of Object.entries(utf8TestCases)) {
                    const result = fromUtf8(str);
                    const bufferResult = Buffer.from(str, 'utf-8');
                    expect(Array.from(result)).toEqual(expected);
                    expect(Array.from(result)).toEqual(Array.from(bufferResult));
                }
            });
        });

        describe('toUtf8', () => {
            it.each(Object.entries(utf8TestCases))('should decode to "%s"', (expected, input) => {
                const result = toUtf8(new Uint8Array(input));
                expect(result).toBe(expected);
            });

            it('should match Buffer.toString behavior', () => {
                for (const [expected, input] of Object.entries(utf8TestCases)) {
                    const result = toUtf8(new Uint8Array(input));
                    const bufferResult = Buffer.from(input).toString('utf-8');
                    expect(result).toBe(expected);
                    expect(result).toBe(bufferResult);
                }
            });

            it('should roundtrip with fromUtf8', () => {
                for (const str of Object.keys(utf8TestCases)) {
                    const encoded = fromUtf8(str);
                    const decoded = toUtf8(encoded);
                    expect(decoded).toBe(str);
                }
            });
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
