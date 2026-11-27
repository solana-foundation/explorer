import type { PublicKey } from '@solana/web3.js';

export function Address({ pubkey, fallbackText }: { pubkey: PublicKey; fallbackText?: string }) {
    return <span data-testid="address">{fallbackText ?? pubkey.toBase58()}</span>;
}
