import { is } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

import { CoinGeckoInfoSchema } from '../lib/coingecko-schema';
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
    market_cap_rank: number | undefined;
    last_updated: Date;
}

export type CoinGeckoResult = {
    coinInfo?: CoinInfo;
    status: CoingeckoStatus;
};

type CoinGeckoSwrKey = ['coingecko', string];

function getCoinGeckoSwrKey(
    cluster: Cluster,
    address: string,
    isTabVisible: boolean,
    enabled: boolean,
): CoinGeckoSwrKey | null {
    if (!enabled) {
        return null;
    }

    if (!isTabVisible) {
        return null;
    }

    if (cluster !== Cluster.MainnetBeta) {
        return null;
    }

    return ['coingecko', address];
}

/** @internal exported for testing */
export const RATE_LIMITED = 'RATE_LIMITED';

/** @internal exported for testing */
export async function fetchCoinGeckoVerification([, address]: CoinGeckoSwrKey): Promise<CoinGeckoResult> {
    const response = await fetch(`/api/verification/coingecko/${address}`);

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error(RATE_LIMITED);
        }
        // 404 = token not on CoinGecko, a permanent result worth caching
        if (response.status === 404) {
            return { status: CoingeckoStatus.FetchFailed };
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!is(data, CoinGeckoInfoSchema)) {
        throw new Error('CoinGecko schema validation failed');
    }

    return {
        coinInfo: {
            last_updated: new Date(data.last_updated),
            market_cap: data.market_data.market_cap.usd,
            market_cap_rank: data.market_cap_rank ?? undefined,
            price: data.market_data.current_price.usd,
            price_change_percentage_24h: data.market_data.price_change_percentage_24h_in_currency?.usd,
            volume_24: data.market_data.total_volume.usd,
        },
        status: CoingeckoStatus.Success,
    };
}

export function useCoinGeckoVerification(address: string, enabled = true): CoinGeckoResult | undefined {
    const { cluster } = useCluster();
    const { visible: isTabVisible } = useTabVisibility();
    const swrKey = getCoinGeckoSwrKey(cluster, address, isTabVisible, enabled);
    const { data, error, isLoading } = useSWR(swrKey, fetchCoinGeckoVerification, TOKEN_VERIFICATION_SWR_CONFIG);

    if (isLoading && !data) {
        return {
            status: CoingeckoStatus.Loading,
        };
    }

    if (error) {
        return {
            status: error?.message === RATE_LIMITED ? CoingeckoStatus.RateLimited : CoingeckoStatus.FetchFailed,
        };
    }

    return data;
}
