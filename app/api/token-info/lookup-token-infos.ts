import {
    createAbortSignal,
    getChainId,
    getTokenInfos,
    getTokenInfosWithMetaplexFallback,
    isTransientError,
    type TokenInfo,
    TokenInfoHttpError,
} from '@entities/token-info/server';
import { Cluster } from '@utils/cluster';
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
    // Bounds the Jupiter lookup well below `maxDuration`, so the on-chain fallback still has time to run.
    const signal = createAbortSignal();
    // The fallback is opt-in, so a caller that needs no on-chain metadata does not wait for the RPC reads.
    const result = includeOnChainFallback
        ? await getTokenInfosWithMetaplexFallback({ addresses, cluster, genesisHash, signal })
        : await getTokenInfos(addresses, cluster, genesisHash, { signal });

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

    return { kind: 'resolved', tokens: result.tokens };
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
