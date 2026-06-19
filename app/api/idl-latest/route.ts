import { clusterFromParam } from '@entities/cluster/server';
import { isTransientRpcError } from '@solana/idl';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { resolveProgramIdls } from '@/app/entities/idl/server';
import { IDL_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * The single IDL-resolution endpoint for known clusters. Resolution lives in `resolveProgramIdls`
 * (shared with the custom/localhost client path); this route is the server transport edge: query
 * parsing, the PMP feature gate, CDN cache headers, and the error-to-HTTP policy. It always resolves
 * the Anchor IDL (unless the program is native) and includes the PMP `idl` IDL when the feature flag
 * is on — consumers read the field they need (`idls.anchor` / `idls.programMetadata`).
 *
 * Error policy: `resolveProgramIdls` throws only on RPC failure — transient blips → retryable,
 * *uncached* 502 (no page); persistent misconfiguration → Sentry page. We never cache a
 * false-negative "no IDLs".
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    // The PMP IDL feature gate lives server-side: include the PMP `idl` IDL only when the flag is on.
    const includePmp = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);

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

    const context = { cluster: clusterProp, programAddress };

    try {
        const { anchorIdl, programMetadataIdl, preferredVariant } = await resolveProgramIdls(
            createSolanaRpc(url),
            programId,
            { includePmp, seed: IDL_SEED },
        );

        const idls = { anchor: anchorIdl, preferred: preferredVariant, programMetadata: programMetadataIdl };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // `resolveProgramIdls` surfaces absent/undecodable as values and throws only on RPC failure.
        // Transient blips → retryable 502 (uncached) without paging; misconfiguration → Sentry page.
        if (isTransientRpcError(error)) {
            Logger.warn('[api:idl-latest] RPC error resolving program IDLs', {
                ...context,
                rpcError: error instanceof Error ? error.message : String(error),
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }
        Logger.panic(new Error('[api:idl-latest] Failed to resolve program IDLs', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Failed to resolve IDLs' }, { status: 502 });
    }
}
