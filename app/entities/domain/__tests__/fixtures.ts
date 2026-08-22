import { type Address, getAddressEncoder } from '@solana/kit';

import { ANS_NAME_RECORD_HEADER_SIZE } from '../lib/ans-name-service';

const addressEncoder = getAddressEncoder();

/**
 * Build an ANS name record account: the 200-byte header — [discriminator(8)] [parentName(32)]
 * [owner(32)] [nclass(32)] [expiresAt(8)] [createdAt(8)] [nonTransferable(1)] [padding(79)] —
 * optionally followed by a free-form payload (reverse-lookup records store the domain name there).
 */
export function makeAnsNameRecordData({
    expiresAt = 0n,
    owner,
    parentName,
    payload,
}: {
    expiresAt?: bigint;
    owner?: Address;
    parentName?: Address;
    payload?: Uint8Array;
} = {}): Uint8Array {
    const data = new Uint8Array(ANS_NAME_RECORD_HEADER_SIZE + (payload?.length ?? 0));
    if (parentName) data.set(addressEncoder.encode(parentName), 8);
    if (owner) data.set(addressEncoder.encode(owner), 40);
    new DataView(data.buffer).setBigUint64(104, expiresAt, true);
    if (payload) data.set(payload, ANS_NAME_RECORD_HEADER_SIZE);
    return data;
}

/** The TLD house account discriminator — base58 'iQgos3SdaVE', the memcmp filter fetchTlds uses. */
const TLD_HOUSE_DISCRIMINATOR_BYTES = new Uint8Array([247, 144, 135, 1, 238, 173, 19, 249]);

/**
 * Build a TLD house account: an 8-byte discriminator and two 32-byte fields precede the parent
 * name account at offset 72, followed by the u32-length-prefixed TLD name at offset 104.
 */
export function makeTldHouseData(tldName: string, parentAccount: Address): Uint8Array {
    const nameBytes = new TextEncoder().encode(tldName);
    const data = new Uint8Array(104 + 4 + nameBytes.length);
    data.set(TLD_HOUSE_DISCRIMINATOR_BYTES, 0);
    data.set(addressEncoder.encode(parentAccount), 72);
    new DataView(data.buffer).setUint32(104, nameBytes.length, true);
    data.set(nameBytes, 108);
    return data;
}
