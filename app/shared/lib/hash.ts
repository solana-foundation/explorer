import { sha256 } from '@noble/hashes/sha256';

import { toHex } from './bytes';

/**
 * Hash bytes to a SHA256 hex digest.
 * Produces a lowercase, unprefixed, 64-character hex string.
 */
export function sha256Hex(data: Uint8Array): string {
    return toHex(sha256(data));
}
