// Lightweight random data generators for Solana-specific test mocks.
// If generators proliferate, consider replacing with `fast-check` arbitraries
// (e.g. fc.bigInt(), fc.sample()) for composability and shrinking support.

import bs58 from 'bs58';

export const gen = {
    bigint: (max = 1_000_000n) => BigInt(Math.floor(Math.random() * Number(max))),
    blockHeight: () => gen.bigint(250_000_000n),
    /** Deterministic blockhash (same seed → same value) so story fixtures stay pixel-stable. */
    blockhash: (seed = 0) => {
        const bytes = new Uint8Array(32);
        for (let i = 0; i < bytes.length; i++) bytes[i] = (seed * 7 + i * 13) & 0xff;
        return bs58.encode(bytes);
    },
    epoch: () => gen.bigint(1_000n),
    signature: () => {
        const bytes = new Uint8Array(64);
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        return bs58.encode(bytes);
    },
    /** Deterministic when seed provided (same seed → same value) so story fixtures stay pixel-stable. */
    slot: (seed?: number) =>
        seed === undefined ? gen.bigint(300_000_000n) : ((BigInt(seed) + 1n) * 2_654_435_761n) % 300_000_000n,
};

/** Stable single-placeholder blockhash. */
export const DEFAULT_BLOCKHASH = gen.blockhash();
