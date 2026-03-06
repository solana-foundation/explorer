import { boolean, is, type } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { TOKEN_VERIFICATION_SWR_CONFIG } from './token-verification-cache';

const JupiterResultSchema = type({
    verified: boolean(),
});

export enum JupiterStatus {
    Success,
    FetchFailed,
    Loading,
    RateLimited,
}

export type JupiterResult = {
    verified: boolean;
    status: JupiterStatus;
};

type JupiterSwrKey = ['jupiter-verification', string];

function getJupiterSwrKey(cluster: Cluster, mintAddress?: string): JupiterSwrKey | null {
    if (!mintAddress || cluster !== Cluster.MainnetBeta) {
        return null;
    }

    return ['jupiter-verification', mintAddress];
}

async function fetchJupiterVerification([, mintAddress]: JupiterSwrKey): Promise<JupiterResult> {
    try {
        const response = await fetch(`/api/verification/jupiter/${mintAddress}`);

        if (!response.ok) {
            if (response.status === 429) {
                return { status: JupiterStatus.RateLimited, verified: false };
            }
            return { status: JupiterStatus.FetchFailed, verified: false };
        }

        const data = await response.json();

        if (!is(data, JupiterResultSchema)) {
            return { status: JupiterStatus.FetchFailed, verified: false };
        }

        return { status: JupiterStatus.Success, verified: data.verified };
    } catch {
        return { status: JupiterStatus.FetchFailed, verified: false };
    }
}

export function useJupiterVerification(mintAddress?: string): JupiterResult | undefined {
    const { cluster } = useCluster();
    const swrKey = getJupiterSwrKey(cluster, mintAddress);
    const { data, isLoading } = useSWR(swrKey, fetchJupiterVerification, TOKEN_VERIFICATION_SWR_CONFIG);

    if (isLoading && !data) {
        return { status: JupiterStatus.Loading, verified: false };
    }

    return data || { status: JupiterStatus.FetchFailed, verified: false };
}
