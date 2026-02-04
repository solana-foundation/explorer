import { getChainId } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';

import { UTL_API_BASE_URL } from '../env';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from './errors';
import { type FetchConfig, type TokenInfo } from './types';

export async function getTokenInfos(
    addresses: string[],
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig
): Promise<TokenInfo[]> {
    if (addresses.length === 0) return [];

    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return [];

    try {
        const response = await fetch(`${UTL_API_BASE_URL}/v1/mints?chainId=${chainId}`, {
            body: JSON.stringify({ addresses }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            next: config?.next,
            signal: config?.signal,
        });

        // checks for 200-299 range
        if (!response.ok) {
            config?.onError?.(new TokenInfoHttpError({ status: response.status, statusText: response.statusText }));
            return [];
        }

        const data = (await response.json()) as { content?: TokenInfo[] };

        if (!data.content) {
            config?.onError?.(new TokenInfoInvalidResponseError());
            return [];
        }

        return data.content;
    } catch (error) {
        config?.onError?.(error);
        return [];
    }
}

export async function getTokenInfo(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig
): Promise<TokenInfo | undefined> {
    const tokens = await getTokenInfos([address], cluster, genesisHash, config);
    return tokens[0];
}
