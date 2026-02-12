/**
 * Type alias for gradual migration from Buffer to Uint8Array.
 * During migration, functions can accept both types.
 * Eventually, this will converge to just Uint8Array.
 */
export type ByteArray = Buffer | Uint8Array;

/**
 * Convert bytes to a binary string.
 * Used for encoding to base64 via btoa().
 */
const fromCharCode = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

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
 * Fallback for toHex when native API is not available.
 */
const toHexFallback = (bytes: ByteArray): string => {
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
export function toHex(bytes: ByteArray): string {
    // Use native Uint8Array.prototype.toHex when available (Chrome 133+, Firefox 133+, Safari 18.2+)
    if ('toHex' in Uint8Array.prototype) {
        return (Uint8Array.prototype.toHex as () => string).call(bytes);
    }
    return toHexFallback(bytes);
}
