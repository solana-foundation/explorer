import { is, number, optional, string, type } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

import { TOKEN_VERIFICATION_SWR_CONFIG } from './token-verification-cache';

export enum CoingeckoStatus {
    Success,
    FetchFailed,
    Loading,
    RateLimited,
}

export interface CoinInfo {
    price: number;
    volume_24: number;
    market_cap: number;
    price_change_percentage_24h: number | undefined;
    market_cap_rank: number;
    last_updated: Date;
}

const CoinInfoResultSchema = type({
    last_updated: string(),
    market_cap_rank: number(),
    market_data: type({
        current_price: type({
            usd: number(),
        }),
        market_cap: type({
            usd: number(),
        }),
        price_change_percentage_24h_in_currency: optional(
            type({
                usd: optional(number()),
            })
        ),
        total_volume: type({
            usd: number(),
        }),
    }),
});

export type CoinGeckoResult = {
    coinInfo?: CoinInfo;
    status: CoingeckoStatus;
};

type CoinGeckoSwrKey = ['coingecko', string];

function getCoinGeckoSwrKey(
    cluster: Cluster,
    coinId: string | undefined,
    isTabVisible: boolean
): CoinGeckoSwrKey | null {
    if (coinId === 'solana') {
        return null;
    }

    if (!isTabVisible) {
        return null;
    }

    if (cluster !== Cluster.MainnetBeta) {
        return null;
    }

    if (!coinId) {
        return null;
    }

    return ['coingecko', coinId];
}

async function fetchCoinGeckoVerification([, coinId]: CoinGeckoSwrKey): Promise<CoinGeckoResult> {
    try {
        const response = await fetch(`/api/verification/coingecko/${coinId}`);

        if (!response.ok) {
            if (response.status === 429) {
                return {
                    status: CoingeckoStatus.RateLimited,
                };
            }
            return {
                status: CoingeckoStatus.FetchFailed,
            };
        }

        const data = await response.json();

        if (!is(data, CoinInfoResultSchema)) {
            return {
                status: CoingeckoStatus.FetchFailed,
            };
        }

        return {
            coinInfo: {
                last_updated: new Date(data.last_updated),
                market_cap: data.market_data.market_cap.usd,
                market_cap_rank: data.market_cap_rank,
                price: data.market_data.current_price.usd,
                price_change_percentage_24h: data.market_data.price_change_percentage_24h_in_currency?.usd,
                volume_24: data.market_data.total_volume.usd,
            },
            status: CoingeckoStatus.Success,
        };
    } catch {
        return {
            status: CoingeckoStatus.FetchFailed,
        };
    }
}

export function useCoinGeckoVerification(coinId?: string): CoinGeckoResult | undefined {
    const { cluster } = useCluster();
    const { visible: isTabVisible } = useTabVisibility();
    const swrKey = getCoinGeckoSwrKey(cluster, coinId, isTabVisible);
    const { data, isLoading } = useSWR(swrKey, fetchCoinGeckoVerification, TOKEN_VERIFICATION_SWR_CONFIG);

    if (isLoading && !data) {
        return {
            status: CoingeckoStatus.Loading,
        };
    }

    return data;
}
