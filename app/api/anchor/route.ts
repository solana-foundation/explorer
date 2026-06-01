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
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    type SolanaError,
    type SolanaRpcApi,
} from '@solana/kit';
import { NextResponse } from 'next/server';
import { inflateSync } from 'zlib';

import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';

import { CACHE_HEADERS, IDL_ACCOUNT_SEED, NON_ANCHOR_PROGRAMS, TRANSIENT_RPC_ERROR_CODES } from './config';

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
