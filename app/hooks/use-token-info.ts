import { PublicKey } from '@solana/web3.js';
import { Token } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { getTokenInfoWithoutOnChainFallback } from '@/app/utils/token-info';

export function useTokenInfo(address: string | undefined, cluster: Cluster) {
    const swrKey = address ? ['token-info', address, cluster] : null;

    return useSWR<Token | undefined>(
        swrKey,
        async () => {
            if (!address) return undefined;
            return await getTokenInfoWithoutOnChainFallback(new PublicKey(address), cluster);
        },
        {
            dedupingInterval: 5 * 60 * 1000,
            focusThrottleInterval: 5 * 60 * 1000,
            revalidateOnFocus: false,
            revalidateOnMount: false,
        }
    );
}
