import React from 'react';

import { useCluster } from '../providers/cluster';
import { Cluster } from './cluster';

export enum JupiterStatus {
    Success,
    FetchFailed,
    Loading,
}

export type JupiterResult = {
    verified: boolean;
    status: JupiterStatus;
};

const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY;

export function useJupiterVerification(mintAddress?: string): JupiterResult | undefined {
    const { cluster } = useCluster();
    const [result, setResult] = React.useState<JupiterResult>();

    React.useEffect(() => {
        if (!mintAddress || cluster !== Cluster.MainnetBeta) {
            return;
        }

        let stale = false;

        const checkVerification = async () => {
            setResult({ status: JupiterStatus.Loading, verified: false });

            try {
                const headers: HeadersInit = JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {};
                const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${mintAddress}`, { headers });

                if (stale) return;

                if (!response.ok) {
                    setResult({ status: JupiterStatus.FetchFailed, verified: false });
                    return;
                }

                const data = await response.json();
                const token = Array.isArray(data) ? data.find((t: { id?: string }) => t.id === mintAddress) : null;

                setResult({ status: JupiterStatus.Success, verified: token?.isVerified === true });
            } catch {
                setResult({ status: JupiterStatus.FetchFailed, verified: false });
            }
        };

        checkVerification();

        return () => {
            stale = true;
        };
    }, [mintAddress, cluster]);

    return result;
}
