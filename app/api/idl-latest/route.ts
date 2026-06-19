import { clusterFromParam } from '@entities/cluster/server';
import { isTransientRpcError } from '@solana/idl';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { resolveProgramIdls } from '@/app/entities/idl/server';
import { IDL_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * The single IDL-resolution endpoint for known clusters. Resolution lives in `resolveProgramIdls`
 * (shared with the custom/localhost client path); this route is the server transport edge: query
 * parsing, CDN cache headers, and the error-to-HTTP policy.
 *
 * Source selection via query flags: default = both; `pmp=0` = Anchor only (the card's Anchor tab and
 * the transaction inspector's `useAnchorProgram`); `anchor=0` = PMP only (`useProgramMetadataIdl`).
 *
 * Error policy: a single source's RPC failure when another resolved is logged (transient → warn,
 * persistent → Sentry page) but never fails the request. When nothing resolved and a source errored,
 * `resolveProgramIdls` throws — transient blips → retryable, *uncached* 502 (no page); persistent
 * misconfiguration → page. We never cache a false-negative "no IDLs".
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    // Source flags (see header): both default on; `pmp=0` = Anchor only, `anchor=0` = PMP only.
    const includePmp = searchParams.get('pmp') !== '0';
    const includeAnchor = searchParams.get('anchor') !== '0';

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
        const { anchorIdl, programMetadataIdl, preferredVariant, rejections } = await resolveProgramIdls(
            createSolanaRpc(url),
            programId,
            { includeAnchor, includePmp, seed: IDL_SEED },
        );

        // At least one IDL resolved but another source errored — log without failing the request.
        for (const reason of rejections) {
            if (isTransientRpcError(reason)) {
                Logger.warn('[api:idl-latest] one IDL source had a transient RPC error (served the others)', {
                    ...context,
                    rpcError: reason instanceof Error ? reason.message : String(reason),
                });
            } else {
                Logger.panic(
                    new Error('[api:idl-latest] one IDL source failed (served the others)', { cause: reason }),
                    {
                        sentryExtras: context,
                    },
                );
            }
        }

        const idls = { anchor: anchorIdl, preferred: preferredVariant, programMetadata: programMetadataIdl };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // Only genuine RPC failures reach here (the resolver swallows absent/undecodable outcomes).
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
