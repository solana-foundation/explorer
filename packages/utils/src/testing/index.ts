import { type Address, address, getBase58Decoder } from '@solana/kit';

const BASE58_DECODER = getBase58Decoder();

/** Deterministic 32-byte address for test fixtures: the same seed always gives the same address. */
export function addressFromSeed(seed: number): Address {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (seed * 19 + i * 23 + 5) & 0xff;
    // Every byte above is taken mod 256, so `seed` and `seed + 256` would collide.
    // Folding the high bits into byte 1 pushes the repeat out to 65536 and leaves seeds under 256 unchanged.
    bytes[1] = (bytes[1] + (seed >>> 8)) & 0xff;
    return address(BASE58_DECODER.decode(bytes));
}

/** Deterministic 64-byte signature for test fixtures, the length of a real signature. */
export function signatureFromSeed(seed: number): string {
    const bytes = new Uint8Array(64);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (seed * 11 + i * 17) & 0xff;
    return BASE58_DECODER.decode(bytes);
}

/**
 * Deterministic 32-byte blockhash for test fixtures.
 * Unbranded: a fixture that feeds kit a lifetime wraps it in kit's `blockhash(...)`, which is where the brand belongs.
 */
export function blockhashFromSeed(seed: number): string {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (seed * 7 + i * 13) & 0xff;
    return BASE58_DECODER.decode(bytes);
}
