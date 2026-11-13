import 'client-only';

import { Cluster } from '@utils/cluster';
import { useMemo } from 'react';

import type { TokenInfoResult } from '../lib/types';
import { useTokenInfos } from './use-token-infos';

export function useUnbatchedTokenInfo({
    cluster,
    genesisHash,
    mint,
}: {
    cluster: Cluster;
    genesisHash: string | undefined;
    mint: string | undefined;
}): TokenInfoResult {
    const mints = useMemo(() => (mint ? [mint] : []), [mint]);
    const { isLoading, tokenInfos } = useTokenInfos(mints, cluster, genesisHash);
    return { isLoading, tokenInfo: mint ? tokenInfos.get(mint) : undefined };
}
