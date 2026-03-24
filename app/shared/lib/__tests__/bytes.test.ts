import { describe, expect, it } from 'vitest';

import { toBase64, toBuffer, toHex } from '../bytes';

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

describe('toBuffer', () => {
    it('should convert empty Uint8Array', () => {
        const result = toBuffer(new Uint8Array([]));
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBe(0);
    });

    it('should preserve bytes', () => {
        const input = new Uint8Array([1, 2, 3, 255]);
        const result = toBuffer(input);
        expect(result).toBeInstanceOf(Buffer);
        expect([...result]).toEqual([1, 2, 3, 255]);
    });

    it('should share the same underlying memory', () => {
        const input = new Uint8Array([10, 20, 30]);
        const result = toBuffer(input);
        input[0] = 99;
        expect(result[0]).toBe(99);
    });

    it('should return the same Buffer when given a Buffer', () => {
        const input = Buffer.from([1, 2, 3]);
        const result = toBuffer(input);
        expect(result).toBe(input);
    });

    it('should handle a Uint8Array view over a larger ArrayBuffer', () => {
        const backing = new ArrayBuffer(16);
        const view = new Uint8Array(backing, 4, 3);
        view.set([0xaa, 0xbb, 0xcc]);
        const result = toBuffer(view);
        expect(result.length).toBe(3);
        expect([...result]).toEqual([0xaa, 0xbb, 0xcc]);
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
