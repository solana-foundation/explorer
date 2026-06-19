import { isTransientRpcError } from '@solana/idl';
import { address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { resolvePmpIdl } from '@/app/entities/idl/server';
import { errors, getMetadataEndpointUrl, SECURITY_TXT_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * Resolve a program's canonical security.txt for a known cluster — the PMP `security` seed, via
 * `@solana/idl`'s `resolvePmpIdl`. Canonical authority only: unlike the IDL seed, security.txt has
 * no Foundation fallback authority. (The IDL seed is served by `/api/idl-latest`; this route is the
 * security.txt counterpart, so neither endpoint conflates the two.)
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
        // Canonical authority only (no fndn fallback — that's IDL-specific).
        const pmp = await resolvePmpIdl(createSolanaRpc(url), programId, SECURITY_TXT_SEED, false);

        let programMetadata: unknown;
        if (pmp?.content) {
            try {
                programMetadata = JSON.parse(pmp.content);
            } catch {
                // Account present but content isn't valid JSON — treat as no metadata and cache.
            }
        }

        return NextResponse.json(
            // eslint-disable-next-line unicorn/no-null -- JSON response contract: explicit null = "no security.txt"
            { programMetadata: programMetadata ?? null },
            { headers: CACHE_HEADERS, status: 200 },
        );
    } catch (error) {
        // resolvePmpIdl returns undefined for "no metadata" (absent/corrupt) and only throws on genuine
        // RPC failures. Transient blips → retryable, *uncached* 502 (no page) so we don't cache a
        // false-negative `null` for everyone; persistent misconfiguration → Sentry page.
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
