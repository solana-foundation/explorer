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

    if (NON_ANCHOR_PROGRAMS.has(programAddress)) {
        return NextResponse.json({ idl: null }, { headers: CACHE_HEADERS, status: 200 });
    }

    let accountData: ReadonlyUint8Array | undefined;
    try {
        accountData = await fetchIdlAccountData(createSolanaRpc(url), programId);
    } catch (error) {
        if (isSolanaError(error)) {
            // Transient upstream RPC failure. Not actionable at the app layer; don't escalate.
            // Return 502 (uncached) so the client may retry.
            Logger.warn('[api:anchor] RPC error fetching IDL account', {
                cluster: clusterProp,
                programAddress,
                rpcError: error.message,
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        // Truly unexpected — escalate.
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
