/**
 * The PMP program id as a LITERAL rather than re-exported from `@solana-program/program-metadata`.
 *
 * That package ships as one bundled ESM file whose top-level imports include pako, yaml and smol-toml, and its
 * `exports` map has no subpath that reaches `PROGRAM_METADATA_PROGRAM_ADDRESS` alone. None of those three are
 * marked side-effect-free, so a single edge from `isProgramMetadataInstruction` - which runs synchronously for
 * every instruction, so it can never be lazy - keeps ~35 KB gzip in the `/tx/*` first-load JS and makes the
 * dynamically imported card pointless.
 *
 * `__tests__/program-address.spec.ts` pins this to the library constant, so drift fails CI.
 */
export const PMP_ADDRESS = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
