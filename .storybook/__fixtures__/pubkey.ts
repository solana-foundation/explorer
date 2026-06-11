import { PublicKey } from '@solana/web3.js';

/**
 * Returns a deterministic PublicKey suitable for story fixtures.
 *
 * With a `seed`: derives the 32-byte address from the human-readable seed (zero-padded). Stable
 * across module reloads AND across captures, and doesn't shift when a new caller is added earlier
 * in the file (unlike `PublicKey.unique()`'s global counter). Use this for named addresses you'll
 * reference repeatedly (ALICE, BOB, the program under test, etc.). Result is NOT a valid Ed25519
 * public key (no private key) — fine for visual fixtures, NOT for signing.
 *
 * Without a `seed`: falls back to `PublicKey.unique()` — deterministic per process via a global
 * counter. Use for anonymous sibling rows where individual identity doesn't matter, only that
 * each row is distinct.
 *
 *   const ALICE = getPubkey('alice');                 // named, fully stable
 *   const ROWS = users.map(u => getPubkey(u.handle)); // stable list ordered by `users`
 *   const ANON = getPubkey();                         // anonymous, unique within process
 */
export function getPubkey(seed?: string): PublicKey {
    if (seed === undefined) return PublicKey.unique();
    if (seed.length > 32) {
        throw new Error(`getPubkey: seed "${seed}" exceeds 32 bytes`);
    }
    const buf = Buffer.alloc(32);
    Buffer.from(seed, 'utf8').copy(buf);
    return new PublicKey(buf);
}
