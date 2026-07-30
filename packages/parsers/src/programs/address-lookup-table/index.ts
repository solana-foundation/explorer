import type { ReadonlyUint8Array } from '@solana/kit';

const ADDRESS_LOOKUP_TABLE_META_BYTES = 56;
const PUBKEY_BYTES = 32;

// Raw-layout heuristic: LookupTableMeta (56 bytes) followed by a whole number of 32-byte addresses.
export function hasAddressLookupTableLayout(rawDataBytes: ReadonlyUint8Array | null): boolean {
    if (!rawDataBytes) {
        return false;
    }
    if (rawDataBytes.length < ADDRESS_LOOKUP_TABLE_META_BYTES) {
        return false;
    }
    const remainingBytes = rawDataBytes.length - ADDRESS_LOOKUP_TABLE_META_BYTES;
    return remainingBytes % PUBKEY_BYTES === 0;
}
