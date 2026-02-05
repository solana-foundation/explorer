'use client';

import { PublicKey } from '@solana/web3.js';
import { Token } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';
import { getTokenInfo, getTokenInfoSwrKey } from '@utils/token-info';
import useSWR from 'swr';

export function useTokenInfo(
    fetchTokenLabelInfo: boolean | undefined,
    pubkey: string,
    cluster: Cluster,
    genesisHash?: string
): Token | undefined {
    const { data } = useSWR<Token | undefined>(
        fetchTokenLabelInfo ? getTokenInfoSwrKey(pubkey, cluster, genesisHash) : null,
        () => getTokenInfo(new PublicKey(pubkey), cluster, genesisHash),
        { dedupingInterval: 60_000 }
    );

    return data;
}
