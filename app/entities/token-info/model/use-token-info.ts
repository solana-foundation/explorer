'use client';

import { Cluster } from '@utils/cluster';
import { getTokenInfoSwrKey } from '@utils/token-info';
import { useEffect } from 'react';
import useSWR from 'swr';

import type { TokenInfo } from '../lib/types';
import { useTokenInfoBatch } from './token-info-batch-provider';

export function useTokenInfo(
    fetchTokenLabelInfo: boolean | undefined,
    pubkey: string,
    cluster: Cluster,
    genesisHash?: string,
): TokenInfo | undefined {
    const requestTokenInfo = useTokenInfoBatch();

    useEffect(() => {
        if (fetchTokenLabelInfo && pubkey) {
            requestTokenInfo(pubkey, cluster, genesisHash);
        }
    }, [fetchTokenLabelInfo, pubkey, cluster, genesisHash, requestTokenInfo]);

    const { data } = useSWR<TokenInfo | undefined>(
        fetchTokenLabelInfo ? getTokenInfoSwrKey(pubkey, cluster, genesisHash) : null,
        null,
    );

    return data;
}
