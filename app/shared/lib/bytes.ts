import type BN from 'bn.js';

/**
 * Type alias for gradual migration from Buffer to Uint8Array.
 * During migration, functions can accept both types.
 * Eventually, this will converge to just Uint8Array.
 */
export type ByteArray = Buffer | Uint8Array;

/**
 * Convert a character to its byte value (0-255).
 * Used for decoding binary strings from atob().
 */
const toCharCode = (c: string): number => c.charCodeAt(0);

/**
 * Convert bytes to a binary string.
 * Used for encoding to base64 via btoa().
 */
const fromCharCode = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

/**
 * Decode base64 string to Uint8Array
 * Replaces: Buffer.from(data, 'base64')
 */
export function fromBase64(base64: string): Uint8Array {
    // Use native Uint8Array.fromBase64 when available
    if ('fromBase64' in Uint8Array) {
        return (Uint8Array.fromBase64 as (s: string, _o?: Object) => Uint8Array)(base64);
    }
    // Fallback to the baseline browser's api
    return Uint8Array.from(atob(base64), toCharCode);
}

/**
 * Encode Uint8Array to base64 string
 * Replaces: buffer.toString('base64')
 */
export function toBase64(bytes: Uint8Array): string {
    // Use native Uint8Array.prototype.toBase64 when available (Chrome 133+, Firefox 133+, Safari 18.2+)
    if ('toBase64' in Uint8Array.prototype) {
        return (Uint8Array.prototype.toBase64 as () => string).call(bytes);
    }
    // Fallback to the baseline browser's api
    return btoa(fromCharCode(bytes));
}

/**
 * Fallback for fromHex when native API is not available.
 */
const fromHexFallback = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    bytes.forEach((_, i) => {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    });
    return bytes;
};

/**
 * Decode hex string to Uint8Array
 * Replaces: Buffer.from(data, 'hex')
 * Handles optional '0x' prefix
 *
 * Note: Using manual conversion as native Uint8Array.fromHex() is not widely adopted yet.
 * Native API available in Chrome 133+, Firefox 133+, Safari 18.2+
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromHex
 */
export function fromHex(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (cleanHex.length === 0) {
        return new Uint8Array(0);
    }
    // Use native Uint8Array.fromHex when available (Chrome 133+, Firefox 133+, Safari 18.2+)
    if ('fromHex' in Uint8Array) {
        return (Uint8Array.fromHex as (s: string) => Uint8Array)(cleanHex);
    }
    return fromHexFallback(cleanHex);
}

/**
 * Fallback for toHex when native API is not available.
 */
const toHexFallback = (bytes: Uint8Array): string => {
    let hex = '';
    bytes.forEach(b => {
        hex += b.toString(16).padStart(2, '0');
    });
    return hex;
};

/**
 * Encode Uint8Array to hex string
 * Replaces: buffer.toString('hex')
 *
 * Note: Using manual conversion as native Uint8Array.prototype.toHex() is not widely adopted yet.
 * Native API available in Chrome 133+, Firefox 133+, Safari 18.2+
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toHex
 */
export function toHex(bytes: Uint8Array): string {
    // Use native Uint8Array.prototype.toHex when available (Chrome 133+, Firefox 133+, Safari 18.2+)
    if ('toHex' in Uint8Array.prototype) {
        return (Uint8Array.prototype.toHex as () => string).call(bytes);
    }
    return toHexFallback(bytes);
}

/**
 * Encode string to Uint8Array (UTF-8)
 * Replaces: Buffer.from(str, 'utf-8') or Buffer.from(str)
 */
export function fromUtf8(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

/**
 * Decode Uint8Array to string (UTF-8)
 * Replaces: buffer.toString('utf-8') or buffer.toString()
 */
export function toUtf8(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

/**
 * Create a zero-filled Uint8Array
 * Replaces: Buffer.alloc(n)
 */
export function alloc(size: number): Uint8Array {
    return new Uint8Array(size);
}

/**
 * Concatenate multiple Uint8Arrays
 * Replaces: Buffer.concat([...])
 */
export function concat(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Compare two Uint8Arrays for equality
 * Replaces: buffer.equals(other)
 * Pattern from: https://github.com/achingbrain/uint8arrays/blob/main/src/equals.ts
 */
export function equals(a: Uint8Array, b: Uint8Array): boolean {
    if (a === b) {
        return true;
    }

    if (a.byteLength !== b.byteLength) {
        return false;
    }

    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Find the index of a byte pattern (string or Uint8Array) in a Uint8Array
 * Replaces: buffer.indexOf(pattern)
 *
 * @param haystack - The Uint8Array to search in
 * @param needle - The pattern to find (string or Uint8Array)
 * @returns The index of the first occurrence, or -1 if not found
 */
export function indexOf(haystack: Uint8Array, needle: string | Uint8Array): number {
    const pattern = typeof needle === 'string' ? fromUtf8(needle) : needle;

    if (pattern.length === 0) {
        return 0;
    }

    if (pattern.length > haystack.length) {
        return -1;
    }

    outer: for (let i = 0; i <= haystack.length - pattern.length; i++) {
        for (let j = 0; j < pattern.length; j++) {
            if (haystack[i + j] !== pattern[j]) {
                continue outer;
            }
        }
        return i;
    }

    return -1;
}

/**
 * Convert BN to Uint8Array
 * Replaces: bn.toArrayLike(Buffer, 'le', size)
 *
 * @param bn - BN instance
 * @param endian - 'le' for little-endian, 'be' for big-endian
 * @param size - Output size in bytes
 */
export function bnToBytes(bn: BN, endian: 'le' | 'be', size: number): Uint8Array {
    // BN.toArray returns number[], convert to Uint8Array
    const arr = bn.toArray(endian, size);
    return new Uint8Array(arr);
}

/**
 * Convert Uint8Array to BN
 * Replaces: new BN(buffer, 'le')
 *
 * Note: Requires BN to be imported by the caller
 */
export function bytesToBn(BNConstructor: typeof BN, bytes: Uint8Array, endian: 'le' | 'be' = 'le'): BN {
    return new BNConstructor(Array.from(bytes), undefined, endian);
}

/**
 * Check if a string is valid base64
 * Replaces: try { Buffer.from(str, 'base64'); return true; } catch { return false; }
 */
export function isValidBase64(str: string): boolean {
    if (!str || typeof str !== 'string') {
        return false;
    }
    // Check for valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
        return false;
    }
    try {
        atob(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if value is a ByteArray (Buffer or Uint8Array)
 */
export function isByteArray(value: unknown): value is ByteArray {
    return value instanceof Uint8Array;
}

/**
 * Normalize any ByteArray to Uint8Array
 * Use this at boundaries when you need a pure Uint8Array
 */
export function toUint8Array(data: ByteArray): Uint8Array {
    // Buffer extends Uint8Array, so instanceof check works for both
    // But if we want a "pure" Uint8Array (not a Buffer subclass), we can copy
    if (data instanceof Uint8Array && data.constructor === Uint8Array) {
        return data;
    }
    return new Uint8Array(data);
}

type BytesEncoding = 'utf8' | 'utf-8' | 'hex' | 'base64';

/**
 * Create Uint8Array from various input types.
 * Drop-in replacement for Buffer.from() with encoding support.
 *
 * @example
 * // From string (UTF-8 by default)
 * bytes('hello')              // same as Buffer.from('hello')
 * bytes('hello', 'utf8')      // same as Buffer.from('hello', 'utf8')
 *
 * // From hex string
 * bytes('deadbeef', 'hex')    // same as Buffer.from('deadbeef', 'hex')
 *
 * // From base64 string
 * bytes('SGVsbG8=', 'base64') // same as Buffer.from('SGVsbG8=', 'base64')
 *
 * // From array of numbers
 * bytes([1, 2, 3])            // same as Buffer.from([1, 2, 3])
 *
 * // From Uint8Array (copy)
 * bytes(existingUint8Array)   // same as Buffer.from(existingUint8Array)
 *
 * // From ArrayBuffer
 * bytes(arrayBuffer)          // same as Buffer.from(arrayBuffer)
 */
export function bytes(input: string, encoding?: BytesEncoding): Uint8Array;
export function bytes(input: ArrayLike<number> | ArrayBufferLike): Uint8Array;
export function bytes(input: string | ArrayLike<number> | ArrayBufferLike, encoding?: BytesEncoding): Uint8Array {
    // Handle string input with encoding
    if (typeof input === 'string') {
        switch (encoding) {
            case 'hex':
                return fromHex(input);
            case 'base64':
                return fromBase64(input);
            case 'utf8':
            case 'utf-8':
            default:
                return fromUtf8(input);
        }
    }

    // Handle ArrayBuffer
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }

    // Handle Uint8Array (make a copy like Buffer.from does)
    if (input instanceof Uint8Array) {
        return new Uint8Array(input);
    }

    // Handle array-like (number[])
    return new Uint8Array(input as ArrayLike<number>);
}
