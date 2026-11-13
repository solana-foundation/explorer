import 'server-only';

import { Logger } from '@shared/lib/logger';
import { Cluster, serverClusterUrl } from '@utils/cluster';

import { getTokenInfos, type TokenInfosResult } from './fetch-token-infos-from-jupiter';
import { getTokenInfosFromMetaplex } from './fetch-token-metaplex';

export async function getTokenInfosWithMetaplexFallback({
    addresses,
    cluster,
    genesisHash,
    signal,
}: {
    addresses: string[];
    cluster: Cluster;
    genesisHash: string | undefined;
    signal: AbortSignal;
}): Promise<TokenInfosResult> {
    const result = await getTokenInfos(addresses, cluster, genesisHash, { signal });
    if (result.kind === 'unavailable') return result;

    const listedAddresses = new Set(result.tokens.map(token => token.address));
    const unlistedAddresses = addresses.filter(address => !listedAddresses.has(address));
    // A custom cluster's endpoint comes from the caller, so a server read would reach any host the caller names.
    if (unlistedAddresses.length === 0 || cluster === Cluster.Custom) return result;

    try {
        const onChainTokens = await getTokenInfosFromMetaplex(unlistedAddresses, serverClusterUrl(cluster), {
            onError: error => Logger.warn('[api:token-info] Metaplex lookup failed', { error }),
        });
        return { ...result, tokens: [...result.tokens, ...onChainTokens] };
    } catch (error) {
        Logger.warn('[api:token-info] Metaplex fallback failed', { error });
        return result;
    }
}
