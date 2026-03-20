import { is, nullable, number, type } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { PRICE_SWR_CONFIG } from './price-cache';

const PriceResponseSchema = type({
    price: nullable(number()),
});

export enum PriceStatus {
    FetchFailed,
    Loading,
    RateLimited,
    Success,
}

export type PriceResult =
    | { status: PriceStatus.FetchFailed; price: null }
    | { status: PriceStatus.Loading; price: null }
    | { status: PriceStatus.RateLimited; price: null }
    | { status: PriceStatus.Success; price: number | null };

type PriceSwrKey = ['receipt-price', string];

function getPriceSwrKey(cluster: Cluster, mintAddress?: string): PriceSwrKey | null {
    if (!mintAddress || cluster !== Cluster.MainnetBeta) {
        return null;
    }

    return ['receipt-price', mintAddress];
}

async function fetchPrice([, mintAddress]: PriceSwrKey): Promise<PriceResult> {
    try {
        const response = await fetch(`/api/receipt/price/${mintAddress}`);

        if (!response.ok) {
            if (response.status === 429) {
                return { price: null, status: PriceStatus.RateLimited };
            }
            return { price: null, status: PriceStatus.FetchFailed };
        }

        const data = await response.json();

        if (!is(data, PriceResponseSchema)) {
            return { price: null, status: PriceStatus.FetchFailed };
        }

        return { price: data.price, status: PriceStatus.Success };
    } catch {
        return { price: null, status: PriceStatus.FetchFailed };
    }
}

export function useTokenPrice(mintAddress?: string): PriceResult | undefined {
    const { cluster } = useCluster();
    const swrKey = getPriceSwrKey(cluster, mintAddress);
    const { data, isLoading } = useSWR(swrKey, fetchPrice, PRICE_SWR_CONFIG);

    if (!swrKey) return undefined;

    if (isLoading && !data) {
        return { price: null, status: PriceStatus.Loading };
    }

    return data || { price: null, status: PriceStatus.FetchFailed };
}
