import { type Address, address } from '@solana/kit';
import type { PublicKey } from '@solana/web3.js';

export function toAddress(publicKey: PublicKey): Address {
    return address(publicKey.toBase58());
}
