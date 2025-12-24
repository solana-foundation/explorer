import type BN from 'bn.js';

/**
 * Type alias for gradual migration from Buffer to Uint8Array.
 * During migration, functions can accept both types.
 * Eventually, this will converge to just Uint8Array.
 */
export type ByteArray = Buffer | Uint8Array;

// ============================================
// BASE64 ENCODING/DECODING
// ============================================

/**
 * Decode base64 string to Uint8Array
 * Replaces: Buffer.from(data, 'base64')
 */
export function fromBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encode Uint8Array to base64 string
 * Replaces: buffer.toString('base64')
 */
export function toBase64(bytes: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}

// ============================================
// HEX ENCODING/DECODING
// ============================================

/**
 * Decode hex string to Uint8Array
 * Replaces: Buffer.from(data, 'hex')
 * Handles optional '0x' prefix
 */
export function fromHex(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (cleanHex.length === 0) {
        return new Uint8Array(0);
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return bytes;
}

/**
 * Encode Uint8Array to hex string
 * Replaces: buffer.toString('hex')
 */
export function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ============================================
// UTF-8 ENCODING/DECODING
// ============================================

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

// ============================================
// ALLOCATION HELPERS
// ============================================

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

// ============================================
// COMPARISON HELPERS
// ============================================

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

// ============================================
// SEARCH HELPERS
// ============================================

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

// ============================================
// BN.JS INTEROP HELPERS
// ============================================

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

// ============================================
// VALIDATION HELPERS
// ============================================

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

// ============================================
// TYPE GUARDS AND CONVERTERS
// ============================================

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

// ============================================
// UNIVERSAL BYTES CREATION
// ============================================

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
