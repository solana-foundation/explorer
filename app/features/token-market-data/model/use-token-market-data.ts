import { is } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

import { MARKET_DATA_SWR_CONFIG } from './market-data-cache';
import { TokenMarketDataSchema } from './market-data-schema';
import { type TokenMarketDataResult, TokenMarketDataStatus } from './types';

export function useTokenMarketData(address: string, enabled = true): TokenMarketDataResult | undefined {
    const { cluster } = useCluster();
    const { visible: isTabVisible } = useTabVisibility();
    const swrKey = getSwrKey(cluster, address, enabled && isTabVisible);
    const { data, isLoading } = useSWR(swrKey, fetchTokenMarketData, MARKET_DATA_SWR_CONFIG);

    if (isLoading && !data) return { status: TokenMarketDataStatus.Loading };
    return data || { status: TokenMarketDataStatus.FetchFailed };
}

type SwrKey = ['token-market-data', string];

function getSwrKey(cluster: Cluster, address: string, enabled: boolean): SwrKey | null {
    // Allow null for SWR key.
    // eslint-disable-next-line unicorn/no-null
    if (!enabled || cluster !== Cluster.MainnetBeta) return null;
    return ['token-market-data', address];
}

/** @internal exported for testing */
export async function fetchTokenMarketData([, address]: SwrKey): Promise<TokenMarketDataResult> {
    try {
        const response = await fetch(`/api/token-market-data/${address}`);

        if (!response.ok) {
            if (response.status === 429) return { status: TokenMarketDataStatus.RateLimited };
            // 404 = no market data for this token.
            return { status: TokenMarketDataStatus.FetchFailed };
        }

        const data = await response.json();
        if (!is(data, TokenMarketDataSchema)) {
            Logger.error(new Error('Market data schema validation failed'), { address, sentry: true });
            return { status: TokenMarketDataStatus.FetchFailed };
        }

        return {
            stats: {
                lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : undefined,
                marketCap: data.marketCap,
                marketCapRank: data.marketCapRank ?? undefined,
                price: data.price,
                priceChange24h: data.priceChange24h,
                volume24h: data.volume24h,
            },
            status: TokenMarketDataStatus.Success,
        };
    } catch {
        return { status: TokenMarketDataStatus.FetchFailed };
    }
}
