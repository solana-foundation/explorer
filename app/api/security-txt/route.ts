import { fetchPmpIdl, isTransientRpcError, unwrapIdl } from '@solana/idl';
import { address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { errors, getMetadataEndpointUrl, SECURITY_TXT_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * Resolve a program's canonical security.txt for a known cluster — the PMP `security` seed, via
 * `@solana/idl`'s `fetchPmpIdl`. Canonical authority only (`authority: null`): unlike the IDL seed,
 * security.txt has no Foundation fallback authority. (The IDL seed is served by `/api/idl-latest`;
 * this route is the security.txt counterpart, so neither endpoint conflates the two.)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
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

    const context = { cluster: clusterProp, programAddress, seed: SECURITY_TXT_SEED };

    try {
        const result = await fetchPmpIdl(createSolanaRpc(url), programId, {
            // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only lookup (no fndn fallback)
            authority: null,
            seed: SECURITY_TXT_SEED,
        });
        // `unwrapIdl` folds absent / corrupt / non-JSON-object content to null — the "no security.txt" case.
        // eslint-disable-next-line unicorn/no-null -- JSON response contract: explicit null = "no security.txt"
        const programMetadata = unwrapIdl(result)?.idl ?? null;

        return NextResponse.json({ programMetadata }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // `fetchPmpIdl` surfaces every data outcome as a value and throws only on genuine RPC failure.
        // Transient blips → retryable, *uncached* 502 (no page) so we don't cache a false-negative
        // `null` for everyone; persistent misconfiguration → Sentry page.
        if (isTransientRpcError(error)) {
            Logger.warn('[api:security-txt] RPC error fetching metadata', {
                ...context,
                rpcError: error instanceof Error ? error.message : String(error),
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }

        Logger.panic(new Error('[api:security-txt] Request failed', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: errors[500] }, { status: 502 });
    }
}
