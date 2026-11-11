import { getChainId } from '@entities/chain-id/@x/token-info';
import { type PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { array, is, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { type TokenInfo, TokenInfoStruct } from '../lib/types';

export async function fetchTokenInfoFromApi(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string,
): Promise<TokenInfo | undefined> {
    const lookup = await lookupTokenInfo({ address: address.toBase58(), cluster, genesisHash });
    return lookup.kind === 'listed' ? lookup.token : undefined;
}

type TokenInfoLookup =
    { kind: 'listed'; token: TokenInfo } | { kind: 'not-listed' } | { kind: 'rate-limited' } | { kind: 'unavailable' };

export async function lookupTokenInfo({
    address,
    cluster,
    genesisHash,
}: {
    address: string;
    cluster: Cluster;
    genesisHash?: string;
}): Promise<TokenInfoLookup> {
    const lookup = await requestTokenInfos({
        addresses: [address],
        cluster,
        genesisHash,
        includeOnChainFallback: false,
    });
    if (lookup.kind !== 'resolved') return lookup;

    const [token] = lookup.tokens;
    return token ? { kind: 'listed', token } : { kind: 'not-listed' };
}

type FetchTokenInfosRequest = {
    addresses: string[];
    cluster: Cluster;
    genesisHash: string | undefined;
    /** The Metaplex RPC reads can outlast a short `signal`, so pass a long one or none. */
    includeOnChainFallback: boolean;
    /** Without one the request waits as long as the platform allows. */
    signal?: AbortSignal;
};

export async function fetchTokenInfosFromApi(request: FetchTokenInfosRequest): Promise<TokenInfo[] | undefined> {
    const lookup = await requestTokenInfos(request);
    return lookup.kind === 'resolved' ? lookup.tokens : undefined;
}

type TokenInfosLookup = { kind: 'resolved'; tokens: TokenInfo[] } | { kind: 'rate-limited' } | { kind: 'unavailable' };

async function requestTokenInfos({
    addresses,
    cluster,
    genesisHash,
    includeOnChainFallback,
    signal,
}: FetchTokenInfosRequest): Promise<TokenInfosLookup> {
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return { kind: 'unavailable' };
    if (addresses.length === 0) return { kind: 'resolved', tokens: [] };
    if (!includeOnChainFallback && !jupiterListsTokensOn(chainId)) return { kind: 'resolved', tokens: [] };

    try {
        const { init, url } = toRouteRequest({ addresses, cluster, genesisHash, includeOnChainFallback });
        const response = await fetch(url, { ...init, signal });

        if (!response.ok) {
            Logger.warn('[token-info] Token info request rejected', {
                sentry: true,
                sentryExtras: { addressCount: addresses.length, cluster, status: response.status },
            });
            return response.status === 429 ? { kind: 'rate-limited' } : { kind: 'unavailable' };
        }

        const body: unknown = await response.json();
        if (!is(body, TokenInfoResponseStruct)) {
            Logger.warn('[token-info] Token info response was not a token array', { sentry: true });
            return { kind: 'unavailable' };
        }

        return { kind: 'resolved', tokens: parseTokenInfos(body.content, cluster) };
    } catch (error) {
        Logger.error(new Error('[token-info] Failed to fetch token info', { cause: error }), {
            sentry: true,
            sentryExtras: { addressCount: addresses.length, cluster },
        });
        return { kind: 'unavailable' };
    }
}

// The CDN caches a GET. The on-chain fallback stays on POST, because the route returns 200
// when an RPC read fails.
function toRouteRequest({
    addresses,
    cluster,
    genesisHash,
    includeOnChainFallback,
}: Omit<FetchTokenInfosRequest, 'signal'>): { init: RequestInit; url: string } {
    if (addresses.length === 1 && !includeOnChainFallback) {
        const query = new URLSearchParams({ cluster: String(cluster) });
        // A named cluster needs no hash, and sending one gives the same mint a second CDN cache key.
        if (cluster === Cluster.Custom && genesisHash) query.set('genesisHash', genesisHash);
        return {
            init: { method: 'GET' },
            url: `/api/token-info/${encodeURIComponent(addresses[0])}?${query.toString()}`,
        };
    }
    return {
        init: {
            body: JSON.stringify({ addresses, cluster, genesisHash, includeOnChainFallback }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        },
        url: '/api/token-info',
    };
}

export function getTokenInfoSwrKey(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
): ['get-token-info', string, Cluster, string | undefined] {
    return ['get-token-info', address, cluster, genesisHash];
}

const TokenInfoResponseStruct = type({ content: array() });

function parseTokenInfos(entries: unknown[], cluster: Cluster): TokenInfo[] {
    const tokens = entries.filter(entry => is(entry, TokenInfoStruct));
    const malformed = entries.length - tokens.length;
    if (malformed > 0) {
        Logger.warn('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { cluster, malformed, total: entries.length },
        });
    }
    return tokens;
}
