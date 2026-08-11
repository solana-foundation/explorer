import type { PublicKey } from '@solana/web3.js';

/**
 * The PMP program id as a LITERAL rather than re-exported from `@solana-program/program-metadata`.
 *
 * That package ships as one bundled ESM file whose top-level imports include pako, yaml and smol-toml, and its
 * `exports` map has no subpath that reaches `PROGRAM_METADATA_PROGRAM_ADDRESS` alone. None of those three are
 * marked side-effect-free, so a single edge from `isProgramMetadataInstruction` - which runs synchronously for
 * every instruction, so it can never be lazy - keeps ~35 KB gzip in the `/tx/*` first-load JS and makes the
 * dynamically imported card pointless.
 */
export const PMP_ADDRESS = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';

/**
 * Whether this account is owned by PMP. Says nothing about which layout its bytes carry, which is what
 * `isPmpMetadataAccountData` answers - the two compose, and neither one implies the other.
 *
 * The `PublicKey` import is type-only and erased at build, so this module keeps its zero runtime imports and the
 * account page's tab gate stays weightless. Do not let a value import into this file.
 */
export function isPmpAccount({ owner }: { owner: PublicKey }): boolean {
    return owner.toBase58() === PMP_ADDRESS;
}
