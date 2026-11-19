import { useTokenInfo } from '@entities/token-info';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

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

export function useJupiterVerification(mintAddress?: string): JupiterResult | undefined {
    const { cluster, genesisHash } = useCluster();
    const mainnetMint = cluster === Cluster.Mainnet ? mintAddress : undefined;
    const { kind, tokenInfo } = useTokenInfo({ cluster, genesisHash, mint: mainnetMint });

    switch (kind) {
        case 'idle':
            return undefined;
        case 'loading':
            return { status: JupiterStatus.Loading, verified: false };
        case 'listed':
            return { status: JupiterStatus.Success, verified: tokenInfo.verified };
        case 'not-listed':
            return { status: JupiterStatus.Success, verified: false };
        case 'rate-limited':
            return { status: JupiterStatus.RateLimited, verified: false };
        case 'unavailable':
            return { status: JupiterStatus.FetchFailed, verified: false };
        default:
            return kind satisfies never;
    }
}
