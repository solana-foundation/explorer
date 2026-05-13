import type { Idl } from '@coral-xyz/anchor';
import { decodeIdlAccount } from '@coral-xyz/anchor/dist/cjs/idl';
import { clusterFromParam } from '@entities/cluster/server';
import {
    type Address,
    address,
    createAddressWithSeed,
    createSolanaRpc,
    getBase64Encoder,
    getProgramDerivedAddress,
    isSolanaError,
    type ReadonlyUint8Array,
    type Rpc,
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
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    type SolanaError,
    type SolanaErrorCode,
    type SolanaRpcApi,
} from '@solana/kit';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '@solana-program/compute-budget';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { NextResponse } from 'next/server';
import { inflateSync } from 'zlib';

import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';
import { LOADER_IDS } from '@/app/utils/programs';

const CACHE_DURATION = 60 * 60; // 60 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

// Anchor's IDL account is a PDA derived from the program id with a fixed seed.
// This is part of Anchor's on-chain protocol contract, stable across versions.
const IDL_ACCOUNT_SEED = 'anchor:idl';

// Programs that cannot have an Anchor IDL by definition (native runtime / well-known
// non-Anchor programs). Short-circuit before any RPC call so we never depend on the
// upstream returning `null` for the derived IDL PDA. Some RPCs have been observed to
// return transient JSON-RPC errors instead of `null` (notably the SIMD-296 testnet),
// which previously surfaced as Sentry panics for every transaction touching System,
// Token, or other builtins.
const NON_ANCHOR_PROGRAMS = new Set<string>([
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
const TRANSIENT_RPC_ERROR_CODES = new Set<SolanaErrorCode>([
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const cluster = clusterFromParam(clusterProp);
    const url = cluster !== undefined ? serverClusterUrl(cluster, '') : undefined;
    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    let programId: Address;
    try {
        programId = address(programAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid program address' }, { status: 400 });
    }

    if (NON_ANCHOR_PROGRAMS.has(programId)) {
        return NextResponse.json({ idl: null }, { headers: CACHE_HEADERS, status: 200 });
    }

    let accountData: ReadonlyUint8Array | undefined;
    try {
        accountData = await fetchIdlAccountData(createSolanaRpc(url), programId);
    } catch (error) {
        if (isSolanaError(error) && classifySolanaError(error) === 'transient') {
            // Ephemeral upstream issue (node unhealthy, slot skipped, JSON-RPC "Internal error",
            // 5xx/429, ...). Not actionable at the app layer; return 502 (uncached) for retry.
            Logger.warn('[api:anchor] RPC error fetching IDL account', {
                cluster: clusterProp,
                programAddress,
                rpcError: error.message,
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        // Misconfiguration (wrong RPC token, missing API plan, method not supported, ...) or
        // any other unexpected throwable. Escalate so Sentry pages us.
        Logger.panic(new Error('[api:anchor] Failed to fetch IDL account', { cause: error }), {
            sentryExtras: { cluster: clusterProp, programAddress },
        });
        return NextResponse.json({ error: 'Failed to fetch IDL' }, { status: 502 });
    }

    if (!accountData) {
        // No IDL account at the derived PDA — not an Anchor program. Cache the negative result.
        return NextResponse.json({ idl: null }, { headers: CACHE_HEADERS, status: 200 });
    }

    try {
        return NextResponse.json({ idl: decodeIdl(accountData) }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // Account exists but its bytes don't decode as a valid Anchor IDL (malformed
        // borsh, bad zlib payload, or invalid JSON). Treat as non-Anchor and cache.
        Logger.warn('[api:anchor] IDL account present but undecodable', {
            cluster: clusterProp,
            decodeError: error instanceof Error ? error.message : String(error),
            programAddress,
        });
        return NextResponse.json({ idl: null }, { headers: CACHE_HEADERS, status: 200 });
    }
}

function classifySolanaError(error: SolanaError): 'transient' | 'misconfig' {
    if (TRANSIENT_RPC_ERROR_CODES.has(error.context.__code)) return 'transient';
    if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) {
        // 5xx = upstream is sick, retryable. 429 = backpressure, also retryable. Everything
        // else in the 4xx range (401/403 wrong token, 404 wrong URL, 410, ...) is persistent
        // misconfig and should page.
        const { statusCode } = error.context;
        return statusCode >= 500 || statusCode === 429 ? 'transient' : 'misconfig';
    }
    return 'misconfig';
}

async function fetchIdlAccountData(
    rpc: Rpc<SolanaRpcApi>,
    programId: Address,
): Promise<ReadonlyUint8Array | undefined> {
    const idlAddr = await deriveIdlAddress(programId);
    const { value } = await rpc.getAccountInfo(idlAddr, { encoding: 'base64' }).send();
    if (!value) return undefined;
    const [base64Data] = value.data;
    return getBase64Encoder().encode(base64Data);
}

function decodeIdl(accountData: ReadonlyUint8Array): Idl {
    // 8-byte Anchor discriminator + borsh-encoded { authority, data }; data is zlib(JSON).
    // decodeIdlAccount's signature is typed with Buffer, so wrap the slice as a zero-copy
    // Buffer view of the same memory.
    const body = Buffer.from(accountData.buffer, accountData.byteOffset + 8, accountData.byteLength - 8);
    const { data } = decodeIdlAccount(body);
    const idl = JSON.parse(new TextDecoder().decode(inflateSync(data)));
    if (!idl || typeof idl !== 'object' || !Array.isArray(idl.instructions)) {
        throw new Error('Decoded IDL has unexpected shape');
    }
    return idl;
}

async function deriveIdlAddress(programId: Address): Promise<Address> {
    const [base] = await getProgramDerivedAddress({ programAddress: programId, seeds: [] });
    return createAddressWithSeed({ baseAddress: base, programAddress: programId, seed: IDL_ACCOUNT_SEED });
}
