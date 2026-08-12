import {
    fetchTotalStakeReward,
    getSolscanApiKey,
    isStakeAccount,
    isStakeTotalRewardEnabled,
    SolscanRequestError,
    SolscanResponseError,
} from '@entities/stake-rewards/server';
import { type Address, isAddress } from '@solana/kit';
import { Cluster, clusterSlug, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS, isTimeoutError, NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';

type Params = { params: Promise<{ address: string }> };

/**
 * `GET /api/stake-rewards/[address]` — a stake account's lifetime inflation reward, in lamports.
 *
 * Server-side because the API key must not reach the browser, and because the result is identical
 * for every visitor: one paged sweep is shared through the CDN rather than repeated per client.
 */
export async function GET(request: Request, props: Params) {
    const { address } = await props.params;

    // First, so a disabled deployment spends nothing even if the endpoint is hit directly.
    if (!isStakeTotalRewardEnabled()) {
        return NextResponse.json(
            { error: 'Stake rewards are not enabled' },
            { headers: NO_STORE_HEADERS, status: 404 },
        );
    }

    if (!isAddress(address)) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Solscan indexes mainnet-beta only. Answering for another cluster would serve a mainnet number
    // under a devnet address, which is worse than refusing.
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get('cluster') ?? clusterSlug(Cluster.MainnetBeta);
    if (cluster !== clusterSlug(Cluster.MainnetBeta)) {
        return NextResponse.json(
            { error: 'Stake rewards are only available on mainnet' },
            { headers: ERROR_CACHE_HEADERS, status: 400 },
        );
    }

    const apiKey = getSolscanApiKey();
    if (!apiKey) {
        Logger.warn('[api:stake-rewards] SOLSCAN_API_KEY is not configured', { sentry: true });
        return NextResponse.json(
            { error: 'Stake rewards are not configured' },
            { headers: NO_STORE_HEADERS, status: 503 },
        );
    }

    try {
        // Gate the metered request behind one cheap RPC call: the route is public, and every cache
        // miss spends shared paid quota across up to ten upstream calls.
        if (!(await isStakeAccount({ address, rpcUrl: serverClusterUrl(Cluster.MainnetBeta) }))) {
            return NextResponse.json({ error: 'Not a stake account' }, { headers: ERROR_CACHE_HEADERS, status: 404 });
        }

        const { epochs, lamports } = await fetchTotalStakeReward({ address, apiKey });
        Logger.info('[api:stake-rewards] Summed stake rewards', { address, epochs });
        return NextResponse.json({ totalReward: lamports }, { headers: CACHE_HEADERS });
    } catch (error) {
        return errorResponse(error, address);
    }
}

function errorResponse(error: unknown, address: Address): NextResponse {
    if (isTimeoutError(error)) {
        Logger.warn('[api:stake-rewards] Upstream request timed out', { address, sentry: true });
        return NextResponse.json(
            { error: 'Upstream request timed out' },
            { headers: ERROR_CACHE_HEADERS, status: 504 },
        );
    }

    if (error instanceof SolscanRequestError) {
        // Pass 429 through rather than masking it as 502: the client must not retry a rate limit,
        // and the shorter error cache lets the next visitor try once the window resets.
        if (error.status === 429) {
            Logger.warn('[api:stake-rewards] Rate limit exceeded', { address, sentry: true });
            return NextResponse.json({ error: 'Rate limit exceeded' }, { headers: ERROR_CACHE_HEADERS, status: 429 });
        }
        // Every other upstream status becomes 502, including 401 — that is our key being rejected,
        // not the caller's, so passing it through would blame the wrong party.
        //
        // 401/403 is tagged apart from the rest because it needs a different response from us: the
        // key is set but has no plan or has expired, so it fails for every account and keeps failing
        // until someone rotates it. A 5xx from Solscan is transient and needs nobody.
        Logger.error(error, {
            address,
            reason: isKeyRejected(error.status) ? 'solscan-key-rejected' : 'solscan-request-failed',
            sentry: true,
            status: error.status,
        });
        return NextResponse.json(
            { error: 'Failed to fetch stake rewards' },
            { headers: NO_STORE_HEADERS, status: 502 },
        );
    }

    // Their answer, not our logic — a warning against the vendor rather than a panic at ourselves.
    // Still 502: we have no total to serve either way.
    if (error instanceof SolscanResponseError) {
        Logger.warn('[api:stake-rewards] Solscan returned an unusable response', {
            address,
            reason: error.message,
            sentry: true,
        });
        return NextResponse.json(
            { error: 'Failed to fetch stake rewards' },
            { headers: NO_STORE_HEADERS, status: 502 },
        );
    }

    Logger.panic(error instanceof Error ? error : new Error('Failed to fetch stake rewards'));
    return NextResponse.json({ error: 'Failed to fetch stake rewards' }, { headers: NO_STORE_HEADERS, status: 502 });
}

/** Solscan rejected the key itself, rather than failing to serve the request. */
function isKeyRejected(status: number): boolean {
    return status === 401 || status === 403;
}
