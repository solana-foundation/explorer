import { serverClusterUrlFromParam } from '@entities/cluster/server';
import { resolveProgramIdls } from '@entities/idl/server';
import { isRetryableError } from '@shared/lib/errors';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';
import { isBlockedRequestError, withOnChainFetch } from '@/app/shared/lib/on-chain-fetch';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

// Resolve IDLs with a few retries. The RPC itself is reliable, but resolving a large IDL through the
// server runtime occasionally premature-closes the response body; a fresh client per attempt clears it.
// That is why this constructs its own client rather than taking the shared one from `getRpc` — reusing
// the cached client would retry through the transport that just failed.
async function resolveProgramIdlsWithRetry(
    url: string,
    programId: Address,
    attempts = 3,
): Promise<Awaited<ReturnType<typeof resolveProgramIdls>>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await resolveProgramIdls(createSolanaRpc(url), programId);
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1 && isRetryableError(error)) {
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

/**
 * The single IDL-resolution endpoint for known clusters. Resolution lives in `resolveProgramIdls`
 * (shared with the custom/localhost client path); this route is the server transport edge: query
 * parsing, CDN cache headers, and the error-to-HTTP policy. It always resolves the Anchor IDL (unless
 * the program is native) and the PMP `idl` IDL — consumers read the field they need (`idls.anchor` /
 * `idls.programMetadata`).
 *
 * Error policy: `resolveProgramIdls` throws only on RPC failure — transient blips → retryable,
 * *uncached* 502 (no page); persistent misconfiguration → Sentry page. We never cache a
 * false-negative "no IDLs".
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const url = serverClusterUrlFromParam(clusterProp);
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
        // Scope `fetch` to the cluster RPC only: `resolveProgramIdls` can follow an off-chain URL stored in a
        // program's on-chain PMP `idl` record, so an unguarded fetch here would let this unauthenticated
        // route be aimed at internal addresses (SSRF). See `withOnChainFetch`.
        const { anchorIdl, anchorIdlAddress, programMetadataIdl, programMetadataIdlAddress } = await withOnChainFetch(
            [url],
            () => resolveProgramIdlsWithRetry(url, programId),
        );

        const idls = {
            anchor: anchorIdl,
            anchorAddress: anchorIdlAddress,
            programMetadata: programMetadataIdl,
            programMetadataAddress: programMetadataIdlAddress,
        };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // An off-chain IDL URL we refuse to fetch server-side (SSRF guard): resolve the on-chain sources and
        // treat the off-chain one as absent. It reaches here only if the resolver surfaced it as a hard
        // failure; return uncached rather than paging or pinning a false-negative "no IDLs".
        if (isBlockedRequestError(error)) {
            Logger.warn('[api:idl-latest] Off-chain IDL URL blocked by SSRF guard', context);
            return NextResponse.json({ error: 'Off-chain IDL not resolvable' }, { status: 502 });
        }

        // `resolveProgramIdls` surfaces absent/undecodable as values and throws only on RPC failure.
        // Transient blips → retryable 502 (uncached) without paging; misconfiguration → Sentry page.
        if (isRetryableError(error)) {
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
