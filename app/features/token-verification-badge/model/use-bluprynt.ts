import { boolean, is, type } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { TOKEN_VERIFICATION_SWR_CONFIG } from './token-verification-cache';

const BlupryntResultSchema = type({
    verified: boolean(),
});

export enum BlupryntStatus {
    Success,
    FetchFailed,
    Loading,
    NotFound,
    RateLimited,
}

export type BlupryntResult = {
    verified: boolean;
    status: BlupryntStatus;
};

type BlupryntSwrKey = ['bluprynt-verification', string];

function getBlupryntSwrKey(cluster: Cluster, mintAddress?: string): BlupryntSwrKey | null {
    if (!mintAddress || cluster !== Cluster.MainnetBeta) {
        return null;
    }

    return ['bluprynt-verification', mintAddress];
}

async function fetchBlupryntVerification([, mintAddress]: BlupryntSwrKey): Promise<BlupryntResult> {
    try {
        const response = await fetch(`/api/verification/bluprynt/${mintAddress}`);

        if (!response.ok) {
            if (response.status === 429) {
                return { status: BlupryntStatus.RateLimited, verified: false };
            }
            return { status: BlupryntStatus.FetchFailed, verified: false };
        }

        const data = await response.json();

        if (!is(data, BlupryntResultSchema)) {
            return { status: BlupryntStatus.FetchFailed, verified: false };
        }

        return {
            status: data.verified ? BlupryntStatus.Success : BlupryntStatus.NotFound,
            verified: data.verified,
        };
    } catch {
        return { status: BlupryntStatus.FetchFailed, verified: false };
    }
}

export function useBlupryntVerification(mintAddress?: string): BlupryntResult | undefined {
    const { cluster } = useCluster();
    const swrKey = getBlupryntSwrKey(cluster, mintAddress);
    const { data, isLoading } = useSWR(swrKey, fetchBlupryntVerification, TOKEN_VERIFICATION_SWR_CONFIG);

    if (isLoading && !data) {
        return { status: BlupryntStatus.Loading, verified: false };
    }

    return data || { status: BlupryntStatus.FetchFailed, verified: false };
}
