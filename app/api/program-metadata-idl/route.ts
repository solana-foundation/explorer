import { address, createSolanaRpc, isSolanaError } from '@solana/kit';
import { NextResponse } from 'next/server';

import { classifySolanaError, resolvePmpIdl } from '@/app/entities/idl/server';
import { errors, getMetadataEndpointUrl, IDL_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    const seed = searchParams.get('seed');

    if (!programAddress || !clusterProp || !seed) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    let programId;
    try {
        programId = address(programAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid program address' }, { status: 400 });
    }

    const url = getMetadataEndpointUrl(Number(clusterProp));
    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    const context = { cluster: clusterProp, programAddress, seed };

    try {
        // For the IDL seed, also consult the non-canonical fallback authorities (pass `true`): this is
        // how Foundation-published native/builtin-program IDLs (e.g. Stake, Config, Address Lookup
        // Table) are surfaced. For other seeds (e.g. security.txt) stay canonical-only.
        const useFallbackAuthorities = seed === IDL_SEED;
        const pmp = await resolvePmpIdl(createSolanaRpc(url), programId, seed, useFallbackAuthorities);

        let programMetadata: unknown = null;
        if (pmp) {
            try {
                programMetadata = JSON.parse(pmp.content);
            } catch {
                // Account present but content isn't valid JSON — treat as no metadata and cache.
                programMetadata = null;
            }
        }

        return NextResponse.json({ programMetadata }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // resolvePmpIdl returns null for "no metadata" (ACCOUNT_NOT_FOUND) and only throws on genuine
        // RPC failures. Transient blips → retryable, *uncached* 502 (no page) so we don't cache a
        // false-negative `null` for everyone; persistent misconfiguration → Sentry page.
        if (isSolanaError(error) && classifySolanaError(error) === 'transient') {
            Logger.warn('[api:program-metadata-idl] RPC error fetching metadata', {
                ...context,
                rpcError: error.message,
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        Logger.panic(new Error('[api:program-metadata-idl] Request failed', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: errors[500] }, { status: 502 });
    }
}
