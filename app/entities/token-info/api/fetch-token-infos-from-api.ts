import { getChainId } from '@entities/chain-id/@x/token-info';
import { type PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { array, is, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { type TokenInfo, TokenInfoStruct } from '../lib/types';

export async function fetchTokenInfoFromApi(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string,
): Promise<TokenInfo | undefined> {
    const tokens = await fetchTokenInfosFromApi({
        addresses: [address.toBase58()],
        cluster,
        genesisHash,
        includeOnChainFallback: false,
    });
    return tokens?.[0];
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

export async function fetchTokenInfosFromApi({
    addresses,
    cluster,
    genesisHash,
    includeOnChainFallback,
    signal,
}: FetchTokenInfosRequest): Promise<TokenInfo[] | undefined> {
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return undefined;
    if (addresses.length === 0) return [];

    try {
        const response = await fetch('/api/token-info', {
            body: JSON.stringify({ addresses, cluster, genesisHash, includeOnChainFallback }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal,
        });

        if (!response.ok) {
            Logger.warn('[token-info] Token info request rejected', {
                sentry: true,
                sentryExtras: { addressCount: addresses.length, cluster, status: response.status },
            });
            return undefined;
        }

        const body: unknown = await response.json();
        if (!is(body, TokenInfoResponseStruct)) {
            Logger.warn('[token-info] Token info response was not a token array', { sentry: true });
            return undefined;
        }

        return parseTokenInfos(body.content, cluster);
    } catch (error) {
        Logger.error(new Error('[token-info] Failed to fetch token info', { cause: error }), {
            sentry: true,
            sentryExtras: { addressCount: addresses.length, cluster },
        });
        return undefined;
    }
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

export function getTokenInfoSwrKey(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
): ['get-token-info', string, Cluster, string | undefined] {
    return ['get-token-info', address, cluster, genesisHash];
}
