import { Address, ReadonlyUint8Array } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

export function decodeString(data: ReadonlyUint8Array) {
    return Buffer.from(data).toString('utf-8');
}

export function mapToPublicKey(address: Address) {
    return new PublicKey(String(address));
}
