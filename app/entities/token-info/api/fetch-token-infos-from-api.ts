import { getChainId } from '@entities/chain-id/@x/token-info';
import { type PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';

import { Logger } from '@/app/shared/lib/logger';

import { type TokenInfo } from '../lib/types';

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

        const { content } = (await response.json()) as { content?: unknown };
        if (!Array.isArray(content)) {
            Logger.warn('[token-info] Token info response was not a token array', { sentry: true });
            return undefined;
        }

        return content as TokenInfo[];
    } catch (error) {
        Logger.error(new Error('[token-info] Failed to fetch token info', { cause: error }), {
            sentry: true,
            sentryExtras: { addressCount: addresses.length, cluster },
        });
        return undefined;
    }
}

export function getTokenInfoSwrKey(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
): ['get-token-info', string, Cluster, string | undefined] {
    return ['get-token-info', address, cluster, genesisHash];
}
