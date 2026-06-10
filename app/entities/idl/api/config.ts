import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '@solana-program/compute-budget';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { LOADER_IDS } from '@/app/utils/programs';

const CACHE_MAX_AGE = 60 * 60; // 60 minutes

export const ANCHOR_CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
};

// Programs that cannot have an Anchor IDL by definition (native runtime / well-known
// non-Anchor programs). Short-circuit before any RPC call so we never depend on the
// upstream returning `null` for the derived IDL PDA. Some RPCs have been observed to
// return transient JSON-RPC errors instead of `null` (notably the SIMD-296 testnet),
// which previously surfaced as Sentry panics for every transaction touching System,
// Token, or other builtins.
export const NON_ANCHOR_PROGRAMS = new Set<string>([
    SYSTEM_PROGRAM_ADDRESS,
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    MEMO_PROGRAM_ADDRESS, // v2
    ...Object.keys(LOADER_IDS), // BPF loaders, Move loader, Native loader
    // No library exports for these:
    'AddressLookupTab1e1111111111111111111111111',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // SPL Associated Token Account
    'Config1111111111111111111111111111111111111',
    'Ed25519SigVerify111111111111111111111111111',
    'KeccakSecp256k11111111111111111111111111111',
    'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', // SPL Memo v1
    'Stake11111111111111111111111111111111111111',
    'Vote111111111111111111111111111111111111111',
    'ZkE1Gama1Proof11111111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
]);
