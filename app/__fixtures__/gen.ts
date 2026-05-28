// Lightweight random data generators for Solana-specific test mocks.
// If generators proliferate, consider replacing with `fast-check` arbitraries
// (e.g. fc.bigInt(), fc.sample()) for composability and shrinking support.

import bs58 from 'bs58';

export const gen = {
    bigint: (max = 1_000_000n) => BigInt(Math.floor(Math.random() * Number(max))),
    blockHeight: () => gen.bigint(250_000_000n),
    epoch: () => gen.bigint(1_000n),
    signature: () => {
        const bytes = new Uint8Array(64);
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        return bs58.encode(bytes);
    },
    slot: () => gen.bigint(300_000_000n),
};
