import { clusterFromParam } from '@entities/cluster/server';
import { type Address, address, createSolanaRpc, isSolanaError } from '@solana/kit';
import { NextResponse } from 'next/server';

import {
    ANCHOR_CACHE_HEADERS as CACHE_HEADERS,
    classifySolanaError,
    NON_ANCHOR_PROGRAMS,
    resolveAnchorIdl,
} from '@/app/entities/idl/server';
import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';

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

    const context = { cluster: clusterProp, programAddress };
    let idl: unknown = null;
    try {
        // resolveAnchorIdl derives the Anchor IDL PDA, fetches + zlib-inflates the account, and
        // parses the JSON. It returns null when there is no IDL account or its bytes are undecodable,
        // and only re-throws genuine RPC failures (SolanaErrors) for us to classify below.
        const anchor = await resolveAnchorIdl(createSolanaRpc(url), programId, context);
        idl = anchor?.idl ?? null;
    } catch (error) {
        if (isSolanaError(error) && classifySolanaError(error) === 'transient') {
            // Ephemeral upstream issue (node unhealthy, slot skipped, JSON-RPC "Internal error",
            // 5xx/429, ...). Not actionable at the app layer; return 502 (uncached) for retry.
            Logger.warn('[api:anchor] RPC error fetching IDL account', { ...context, rpcError: error.message });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        // Misconfiguration (wrong RPC token, missing API plan, method not supported, ...) or any
        // other unexpected throwable. Escalate so Sentry pages us.
        Logger.panic(new Error('[api:anchor] Failed to fetch IDL account', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Failed to fetch IDL' }, { status: 502 });
    }

    return NextResponse.json({ idl }, { headers: CACHE_HEADERS, status: 200 });
}
