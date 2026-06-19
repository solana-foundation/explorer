import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '@solana-program/compute-budget';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { LOADER_IDS, ZK_ELGAMAL_PROOF_PROGRAM_ID } from '@/app/utils/programs';

// Programs that cannot have an Anchor IDL by definition (native runtime / well-known
// non-Anchor programs). Short-circuit before any RPC call so we never depend on the
// upstream returning `null` for the derived IDL PDA. Some RPCs have been observed to
// return transient JSON-RPC errors instead of `null` (notably the SIMD-296 testnet),
// which previously surfaced as Sentry panics for every transaction touching System,
// Token, or other builtins.
// This is a curated behavioral list (skip the Anchor IDL PDA lookup), not the display
// registry in `@/app/utils/programs` — so we reuse the few addresses that already have a
// canonical export and keep the rest as local literals rather than coupling RPC behavior
// to that registry or minting single-use exports for immutable runtime addresses.
export const NON_ANCHOR_PROGRAMS = new Set<string>([
    SYSTEM_PROGRAM_ADDRESS,
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    MEMO_PROGRAM_ADDRESS, // v2
    STAKE_PROGRAM_ADDRESS,
    ZK_ELGAMAL_PROOF_PROGRAM_ID,
    ...Object.keys(LOADER_IDS), // BPF loaders, Move loader, Native loader
    // No canonical export for these — kept as local literals:
    'AddressLookupTab1e1111111111111111111111111',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // SPL Associated Token Account
    'Config1111111111111111111111111111111111111',
    'Ed25519SigVerify111111111111111111111111111',
    'KeccakSecp256k11111111111111111111111111111',
    'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', // SPL Memo v1
    'Vote111111111111111111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
]);
