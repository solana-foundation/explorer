import {
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__JSON_RPC__SCAN_ERROR,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE,
    type SolanaErrorCode,
} from '@solana/kit';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '@solana-program/compute-budget';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { LOADER_IDS } from '@/app/utils/programs';

export const CACHE_MAX_AGE = 60 * 60; // 60 minutes

export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
};

// Anchor's IDL account is a PDA derived from the program id with a fixed seed.
// This is part of Anchor's on-chain protocol contract, stable across versions.
export const IDL_ACCOUNT_SEED = 'anchor:idl';

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

// SolanaError codes that represent ephemeral upstream-state issues for a `getAccountInfo`
// call: the node is briefly unhealthy, the slot was skipped, the snapshot/block isn't
// available yet, the JSON-RPC server returned a generic "Internal error", etc. They are
// not actionable at the app layer and recur naturally — warn and let the client retry.
// Everything outside this set (auth, plan, malformed responses, programmer-bug-class
// codes) falls through to `Logger.panic` so misconfiguration surfaces in Sentry.
export const TRANSIENT_RPC_ERROR_CODES = new Set<SolanaErrorCode>([
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__JSON_RPC__SCAN_ERROR,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE,
]);
