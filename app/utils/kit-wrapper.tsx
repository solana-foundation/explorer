import { Address, ReadonlyUint8Array } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

import { toUtf8 } from '@/app/shared/lib/bytes';

export function decodeString(data: ReadonlyUint8Array) {
    return toUtf8(new Uint8Array(data));
}

export function mapToPublicKey(address: Address) {
    return new PublicKey(String(address));
}
