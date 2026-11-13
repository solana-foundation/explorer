import 'client-only';

import { getChainId } from '@entities/chain-id/@x/token-info';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

import { accountRefreshKey } from '@/app/shared/lib/account-refresh-key';

import { lookupTokenInfo } from '../api/fetch-token-infos-from-api';
import type { TokenInfo, TokenInfoResult } from '../lib/types';

export function useAccountRefreshTokenInfo({
    cluster,
    genesisHash,
    mint,
    url,
}: {
    cluster: Cluster;
    genesisHash: string | undefined;
    mint: string | undefined;
    url: string;
}): TokenInfoResult {
    // Without a chain id nothing can resolve, so skip the request.
    const key =
        mint && getChainId(cluster, genesisHash) ? getMintTokenInfoSwrKey(url, mint, cluster, genesisHash) : undefined;
    const { data, error, isLoading } = useSWRImmutable(
        key,
        fetchMintTokenInfo,
        // The token-info request logs each failure, so a refresh or a remount retries it instead of SWR.
        { shouldRetryOnError: false },
    );
    // SWR keeps the error while a refresh runs, so a refresh after a failure does not report loading.
    return { isLoading: isLoading && error === undefined, tokenInfo: data ?? undefined };
}

type MintTokenInfoSwrKey = readonly ['account-refresh', string, string, 'mint-token-info', Cluster, string | undefined];

function getMintTokenInfoSwrKey(
    url: string,
    mint: string,
    cluster: Cluster,
    genesisHash: string | undefined,
): MintTokenInfoSwrKey {
    return accountRefreshKey(url, mint, 'mint-token-info', cluster, genesisHash);
}

async function fetchMintTokenInfo(key: MintTokenInfoSwrKey): Promise<TokenInfo | null> {
    const [, , address, , cluster, genesisHash] = key;
    const lookup = await lookupTokenInfo({ address, cluster, genesisHash });
    if (lookup.kind === 'listed') return lookup.token;
    // SWR sets `isLoading` while a request runs and `data` is `undefined`, so a mint without token info caches `null`.
    // eslint-disable-next-line unicorn/no-null -- see above
    if (lookup.kind === 'not-listed') return null;
    // A failure throws, so SWR does not cache it as a mint without token info.
    throw new Error('[token-info] Token info request failed');
}
