import { getTokenInfos, getTokenInfosFromMetaplex, isValidCluster, type TokenInfo } from '@entities/token-info/server';
import { isAddress } from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

const CACHE_MAX_AGE = 3600; // 1 hour

/**
 * Caps how many distinct mints one request may resolve. `TokensProvider` sends
 * up to 101 token accounts, so this leaves headroom without letting a caller
 * fan out an unbounded number of RPC lookups.
 */
const MAX_ADDRESSES = 128;

type RequestBody = {
    address?: unknown;
    addresses?: unknown;
    cluster?: unknown;
    genesisHash?: unknown;
    includeOnChainFallback?: unknown;
};

export async function POST(request: Request) {
    let body: RequestBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { cluster, genesisHash } = body;
    const maybeGenesisHash = typeof genesisHash === 'string' ? genesisHash : undefined;
    const addresses = parseAddresses(body);

    if (!addresses || !isValidCluster(cluster, maybeGenesisHash)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (addresses.length === 0) {
        return NextResponse.json({ content: [] });
    }

    // Allow to resolve chainId with genesisHash as the request does not use Connection instance
    // For requests that use Connection, Custom cluster should be disabled
    const listed = await getTokenInfos(addresses, cluster, maybeGenesisHash, {
        next: { revalidate: CACHE_MAX_AGE },
    });

    // Opt-in: only the batch path used to get the SDK's on-chain fallback, so
    // single-mint callers keep paying for the list lookup alone.
    const tokens =
        body.includeOnChainFallback === true
            ? await withMetaplexFallback(listed, addresses, cluster, request.url)
            : listed;

    // `content` is always an array; single-address callers read `content[0]`.
    return NextResponse.json({ content: tokens });
}

/**
 * Reads the requested mints. Accepts a single `address` or an `addresses`
 * array; `address` is kept for the callers that resolve one mint at a time.
 */
function parseAddresses(body: RequestBody): string[] | undefined {
    let raw: unknown[] | undefined;
    if (Array.isArray(body.addresses)) raw = body.addresses;
    else if (body.address !== undefined) raw = [body.address];

    if (!raw) return undefined;

    // De-duplicate before the cap: one transaction often moves the same mint through several token
    // accounts, and a repeated mint costs one lookup rather than a slot against the limit.
    const unique = Array.from(new Set(raw));
    if (unique.length > MAX_ADDRESSES) return undefined;
    if (!unique.every((value): value is string => typeof value === 'string' && isAddress(value))) return undefined;

    return unique;
}

/**
 * Fills in mints the UTL list does not carry by reading their on-chain Metaplex
 * metadata. The fallback is best-effort: a failure here still returns the
 * listed tokens.
 */
async function withMetaplexFallback(
    listed: TokenInfo[],
    addresses: string[],
    cluster: Cluster,
    requestUrl: string,
): Promise<TokenInfo[]> {
    const found = new Set(listed.map(token => token.address));
    const missing = addresses.filter(address => !found.has(address));
    if (missing.length === 0) return listed;

    // Resolved server-side on purpose: forwarding the browser's RPC URL would let any caller
    // point this route at an arbitrary host.
    //
    // The cost is `Cluster.Custom`, whose endpoint only the browser knows, so it returns ''
    // and the on-chain fallback is skipped. No regression: a custom cluster has no chain id
    // unless the caller supplies a matching `genesisHash`, and neither `TokenBalancesCard` nor
    // `TokensProvider` does, so `getTokenInfos` already returned nothing there. Where a chain
    // id does resolve, the UTL list is still served — only the on-chain fallback is dropped.
    const rpcEndpoint = serverClusterUrl(cluster, '');
    if (!rpcEndpoint) return listed;

    try {
        const onChain = await getTokenInfosFromMetaplex(missing, rpcEndpoint, {
            baseUrl: new URL(requestUrl).origin,
            onError: error => Logger.warn('[api:token-info] Metaplex lookup failed', { error }),
        });
        return [...listed, ...onChain];
    } catch (error) {
        Logger.warn('[api:token-info] Metaplex fallback failed', { error });
        return listed;
    }
}
