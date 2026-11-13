import { lookupTokenInfo } from '@entities/token-info';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { TOKEN_VERIFICATION_SWR_CONFIG } from './token-verification-cache';

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
    const lookup = await lookupTokenInfo({ address: mintAddress, cluster: Cluster.MainnetBeta });
    switch (lookup.kind) {
        case 'listed':
            return { status: JupiterStatus.Success, verified: lookup.token.verified };
        case 'not-listed':
            return { status: JupiterStatus.Success, verified: false };
        case 'rate-limited':
            return { status: JupiterStatus.RateLimited, verified: false };
        case 'unavailable':
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
