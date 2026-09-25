import { getRpc, serverClusterUrlFromParam } from '@entities/cluster/server';
import { errors } from '@entities/program-metadata/server';
import { fetchProgramSecurityTxt } from '@entities/security-txt/server';
import { isRetryableError } from '@shared/lib/errors';
import { type Address, address } from '@solana/kit';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';
import { isBlockedRequestError, withOnChainFetch } from '@/app/shared/lib/on-chain-fetch';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

/**
 * Resolve a program's security.txt for a known cluster via `@solana/security-txt`: the PMP `security`
 * seed (canonical authority only — no fndn fallback) then the legacy Neodyme ELF section.
 *
 * Error policy mirrors `/api/idl-latest`: a transient RPC blip → retryable, *uncached* 502 (no page);
 * persistent misconfiguration → Sentry page. Absent / unparseable security.txt is a cacheable 200.
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
        const rpc = getRpc(url);
        // Scope `fetch` to the cluster RPC only: `@solana/security-txt` resolves the PMP `security` record,
        // which can point at an off-chain URL stored on-chain - an unguarded fetch here would let this
        // unauthenticated route be aimed at internal addresses (SSRF). See `withOnChainFetch`.
        const securityTxt = await withOnChainFetch([url], () => fetchProgramSecurityTxt(rpc, programId));

        // `securityTxt` omitted (undefined) when absent — the "no security.txt" case, cacheable.
        return NextResponse.json({ securityTxt }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // An off-chain security.txt URL we refuse to fetch server-side (SSRF guard): treat it as absent, but
        // do not cache - the content is real, we simply will not resolve it here, so this is not a durable
        // "no security.txt".
        if (isBlockedRequestError(error)) {
            Logger.warn('[api:security-txt] Off-chain security.txt URL blocked by SSRF guard', context);
            // The same absent-security.txt shape as the found-nothing path, but uncached: the record is real,
            // we simply will not resolve it server-side, so this is not a durable "no security.txt".
            return NextResponse.json({}, { status: 200 });
        }

        // `@solana/security-txt` surfaces absent/unparseable as a value and throws only on RPC failure.
        // Transient blips → retryable, *uncached* 502 (no page); persistent misconfiguration → Sentry.
        if (isRetryableError(error)) {
            Logger.warn('[api:security-txt] RPC error fetching security.txt', {
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
