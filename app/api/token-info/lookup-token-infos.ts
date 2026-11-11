import {
    createAbortSignal,
    getChainId,
    getTokenInfos,
    getTokenInfosFromMetaplex,
    isTransientError,
    type TokenInfo,
    TokenInfoHttpError,
} from '@entities/token-info/server';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

type TokenInfosLookup = { kind: 'resolved'; tokens: TokenInfo[] } | { kind: 'rate-limited' } | { kind: 'unavailable' };

export async function lookupTokenInfos({
    addresses,
    cluster,
    genesisHash,
    includeOnChainFallback,
}: {
    addresses: string[];
    cluster: Cluster;
    genesisHash: string | undefined;
    includeOnChainFallback: boolean;
}): Promise<TokenInfosLookup> {
    // Allow to resolve chainId with genesisHash as the request does not use Connection instance
    // For requests that use Connection, Custom cluster should be disabled
    const result = await getTokenInfos(addresses, cluster, genesisHash, {
        // Bounds the lookup well below `maxDuration`, so the on-chain fallback still has time to run.
        signal: createAbortSignal(),
    });

    if (result.kind === 'unavailable') {
        reportUnavailable(result.error, {
            addressCount: addresses.length,
            chainId: getChainId(cluster, genesisHash),
            cluster,
        });
        return isRateLimited(result.error) ? { kind: 'rate-limited' } : { kind: 'unavailable' };
    }

    if (result.malformed > 0) {
        Logger.warn('[api:token-info] Token lookup dropped malformed tokens', {
            sentry: true,
            sentryExtras: { addressCount: addresses.length, cluster, malformed: result.malformed },
        });
    }

    // Opt-in, so a caller that needs no on-chain metadata does not wait for the RPC reads.
    const tokens = includeOnChainFallback
        ? await withMetaplexFallback(result.tokens, addresses, cluster)
        : result.tokens;

    return { kind: 'resolved', tokens };
}

export function invalidRequest(): NextResponse {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export function upstreamRateLimited(headers?: HeadersInit): NextResponse {
    return NextResponse.json({ error: 'Token info rate limited' }, { headers, status: 429 });
}

export function upstreamUnavailable(headers?: HeadersInit): NextResponse {
    return NextResponse.json({ error: 'Token info unavailable' }, { headers, status: 503 });
}

function reportUnavailable(error: unknown, extras: Record<string, unknown>): void {
    if (isRateLimited(error)) {
        Logger.warn('[api:token-info] Jupiter rate limit exceeded', { sentry: true, sentryExtras: extras });
        return;
    }
    const message = '[api:token-info] Token lookup unavailable';
    if (isTransientError(error)) {
        Logger.warn(message, {
            sentry: true,
            sentryExtras: { ...extras, upstreamError: error instanceof Error ? error.message : String(error) },
        });
        return;
    }
    Logger.error(new Error(message, { cause: error }), { sentry: true, sentryExtras: extras });
}

function isRateLimited(error: unknown): boolean {
    return error instanceof TokenInfoHttpError && error.status === 429;
}

/**
 * Fills in the mints with no token info by reading their on-chain Metaplex
 * metadata. The fallback is best-effort: a failure here still returns the
 * listed tokens.
 */
async function withMetaplexFallback(listed: TokenInfo[], addresses: string[], cluster: Cluster): Promise<TokenInfo[]> {
    const found = new Set(listed.map(token => token.address));
    const missing = addresses.filter(address => !found.has(address));
    if (missing.length === 0) return listed;

    // Resolved server-side on purpose: forwarding the browser's RPC URL would let any caller
    // point this route at an arbitrary host. Only the browser knows a custom cluster's endpoint,
    // so a custom cluster gets no on-chain fallback.
    if (cluster === Cluster.Custom) return listed;

    // `!rpcEndpoint` still guards a `*_RPC_URL` env var set to `""`, which survives the `??`
    // fallback in `serverClusterUrl`.
    const rpcEndpoint = serverClusterUrl(cluster);
    if (!rpcEndpoint) return listed;

    try {
        const onChain = await getTokenInfosFromMetaplex(missing, rpcEndpoint, {
            onError: error => Logger.warn('[api:token-info] Metaplex lookup failed', { error }),
        });
        return [...listed, ...onChain];
    } catch (error) {
        Logger.warn('[api:token-info] Metaplex fallback failed', { error });
        return listed;
    }
}
