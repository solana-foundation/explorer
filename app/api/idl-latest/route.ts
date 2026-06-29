import { serverClusterUrlFromParam } from '@entities/cluster/server';
import { resolveProgramIdls } from '@entities/idl/server';
import { isTransientRpcError } from '@solana/idl';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';
import { isEnvEnabled } from '@/app/utils/env';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

// Connection-level fetch failures (undici "Premature close" / aborted body) that aren't classified as
// RPC errors but are still transient — large IDL account fetches intermittently hit these. Worth a retry.
function isRetryableFetchError(error: unknown): boolean {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return (
        message.includes('premature close') ||
        message.includes('terminated') ||
        message.includes('econnreset') ||
        message.includes('fetch failed') ||
        message.includes('other side closed')
    );
}

// Resolve IDLs with a few retries. The RPC itself is reliable, but resolving a large IDL through the
// server runtime occasionally premature-closes the response body; a fresh client per attempt clears it.
async function resolveProgramIdlsWithRetry(
    url: string,
    programId: Address,
    options: Parameters<typeof resolveProgramIdls>[2],
    attempts = 3,
): Promise<Awaited<ReturnType<typeof resolveProgramIdls>>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await resolveProgramIdls(createSolanaRpc(url), programId, options);
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1 && (isTransientRpcError(error) || isRetryableFetchError(error))) {
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
        const { anchorIdl, programMetadataIdl, preferredVariant } = await resolveProgramIdlsWithRetry(url, programId, {
            includePmp,
        });

        const idls = { anchor: anchorIdl, preferred: preferredVariant, programMetadata: programMetadataIdl };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // `resolveProgramIdls` surfaces absent/undecodable as values and throws only on RPC failure.
        // Transient blips → retryable 502 (uncached) without paging; misconfiguration → Sentry page.
        if (isTransientRpcError(error) || isRetryableFetchError(error)) {
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
