import { boolean, is, optional, string, type } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';
import useTabVisibility from '@/app/utils/use-tab-visibility';

import { TOKEN_VERIFICATION_SWR_CONFIG } from './token-verification-cache';

const CoinGeckoResultSchema = type({ coinGeckoId: optional(string()), verified: boolean() });

export enum CoingeckoStatus {
    Success,
    FetchFailed,
    Loading,
    RateLimited,
}

export type CoinGeckoResult = { coinGeckoId?: string; verified: boolean; status: CoingeckoStatus };

type CoinGeckoSwrKey = ['coingecko', string];

function getCoinGeckoSwrKey(
    cluster: Cluster,
    address: string,
    isTabVisible: boolean,
    enabled: boolean,
): CoinGeckoSwrKey | null {
    // SWR treats a null key as "skip fetch" — only fetch for a visible mainnet token mint.
    // eslint-disable-next-line unicorn/no-null
    if (!enabled || !isTabVisible || cluster !== Cluster.MainnetBeta) return null;
    return ['coingecko', address];
}

/** @internal exported for testing */
export async function fetchCoinGeckoVerification([, address]: CoinGeckoSwrKey): Promise<CoinGeckoResult> {
    try {
        const response = await fetch(`/api/verification/coingecko/${address}`);

        if (!response.ok) {
            if (response.status === 429) return { status: CoingeckoStatus.RateLimited, verified: false };
            return { status: CoingeckoStatus.FetchFailed, verified: false };
        }

        const data = await response.json();
        if (!is(data, CoinGeckoResultSchema)) {
            Logger.error(new Error('[coingecko-verification] CoinGecko schema validation failed'), {
                address,
                sentry: true,
            });
            return { status: CoingeckoStatus.FetchFailed, verified: false };
        }

        return { coinGeckoId: data.coinGeckoId, status: CoingeckoStatus.Success, verified: data.verified };
    } catch (error) {
        // Logged locally only (not sentry).
        Logger.error(new Error('[coingecko-verification] Fetch failed', { cause: error }), { address });
        return { status: CoingeckoStatus.FetchFailed, verified: false };
    }
}

export function useCoinGeckoVerification(address: string, enabled = true): CoinGeckoResult | undefined {
    const { cluster } = useCluster();
    const { visible: isTabVisible } = useTabVisibility();
    const swrKey = getCoinGeckoSwrKey(cluster, address, isTabVisible, enabled);
    const { data, isLoading } = useSWR(swrKey, fetchCoinGeckoVerification, TOKEN_VERIFICATION_SWR_CONFIG);

    if (isLoading && !data) return { status: CoingeckoStatus.Loading, verified: false };
    return data || { status: CoingeckoStatus.FetchFailed, verified: false };
}
