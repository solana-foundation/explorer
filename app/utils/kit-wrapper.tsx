import { PublicKey } from '@solana/web3.js';
import { Address as TAddress, ReadonlyUint8Array } from 'web3js-experimental';

export function decodeString(data: ReadonlyUint8Array) {
    return Buffer.from(data).toString('utf-8');
}

export function mapToPublicKey(address: TAddress) {
    return new PublicKey(String(address));
}
