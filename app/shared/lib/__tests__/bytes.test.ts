import { describe, expect, it } from 'vitest';

import { toBase64, toHex } from '../bytes';

// Note: Buffer is used in tests for decoding since tests run in Node.js environment.
// The production code uses only Uint8Array for browser compatibility.

describe('toHex', () => {
    it('should convert empty array', () => {
        expect(toHex(new Uint8Array([]))).toBe('');
    });

    it('should convert single byte', () => {
        expect(toHex(new Uint8Array([0]))).toBe('00');
        expect(toHex(new Uint8Array([255]))).toBe('ff');
        expect(toHex(new Uint8Array([16]))).toBe('10');
    });

    it('should convert multiple bytes', () => {
        expect(toHex(new Uint8Array([0, 1, 2, 255]))).toBe('000102ff');
    });

    it('should pad single digit hex values', () => {
        expect(toHex(new Uint8Array([1, 2, 3]))).toBe('010203');
    });

    it('should match Buffer.toString("hex")', () => {
        const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        expect(toHex(data)).toBe(Buffer.from(data).toString('hex'));
    });
});

describe('toBase64', () => {
    it('should convert empty array', () => {
        expect(toBase64(new Uint8Array([]))).toBe('');
    });

    it('should convert "Hello"', () => {
        const data = new Uint8Array([72, 101, 108, 108, 111]);
        expect(toBase64(data)).toBe('SGVsbG8=');
    });

    it('should handle padding correctly', () => {
        expect(toBase64(new Uint8Array([1]))).toBe('AQ==');
        expect(toBase64(new Uint8Array([1, 2]))).toBe('AQI=');
        expect(toBase64(new Uint8Array([1, 2, 3]))).toBe('AQID');
    });

    it('should match Buffer.toString("base64")', () => {
        const data = new Uint8Array([72, 101, 108, 108, 111]);
        expect(toBase64(data)).toBe(Buffer.from(data).toString('base64'));
    });

    it('should handle binary data with high bytes', () => {
        const data = new Uint8Array([128, 255, 0, 1]);
        expect(toBase64(data)).toBe(Buffer.from(data).toString('base64'));
    });
});
