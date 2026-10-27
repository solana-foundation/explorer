import type { PublicKey } from '@solana/web3.js';

export function Address({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) {
    return <span data-testid="address">{overrideText ?? pubkey.toBase58()}</span>;
}
