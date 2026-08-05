// @noble/hashes + kit base64 (not node:crypto/Buffer) so the module stays environment-agnostic
// for browser consumers; digests are byte-identical, ~10x slower but single-digit ms at real sizes.
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { getBase64Encoder, type ReadonlyUint8Array } from '@solana/kit';

// osec hashes the deployed executable with trailing zero-padding trimmed — must match to compare against on_chain_hash.
export function hashProgramBytes(bytes: ReadonlyUint8Array | Uint8Array): string {
    let truncatedBytes = 0;
    while (truncatedBytes < bytes.length && bytes[bytes.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    return bytesToHex(sha256(bytes.slice(0, bytes.length - truncatedBytes)));
}

export function hashProgramData(dataBase64: string): string {
    return hashProgramBytes(getBase64Encoder().encode(dataBase64));
}
