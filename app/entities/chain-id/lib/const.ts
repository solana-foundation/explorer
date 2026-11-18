import { isBlockhash } from '@solana/kit';
import { create, define } from 'superstruct';

declare const genesisHash: unique symbol;

// A brand, so an RPC URL does not type-check where a genesis hash is expected.
export type GenesisHash = string & { readonly [genesisHash]: true };

export const GenesisHashFromString = define<GenesisHash>('GenesisHashFromString', value =>
    typeof value === 'string' && isBlockhash(value) ? true : 'Expected a base58-encoded genesis hash',
);

/// Current Genesis Hashes for default clusters.
// Use fixed values to prevent additional requests to determine chainId for different clusters
export const GENESIS_HASHES = {
    DEVNET: create('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', GenesisHashFromString),
    MAINNET: create('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d', GenesisHashFromString),
    TESTNET: create('4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY', GenesisHashFromString),
} as const;
