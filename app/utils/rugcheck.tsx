import React from 'react';

import { useCluster } from '../providers/cluster';
import { createCacheKey, getFromCache, setToCache } from './token-verification-cache';
import { Cluster } from './cluster';
import { EVerificationSource } from '../features/token-verification-badge';

export enum RugCheckStatus {
    Success,
    FetchFailed,
    Loading,
}

export type RugCheckResult = {
    score: number;
    status: RugCheckStatus;
};

export enum ERiskLevel {
    Good = 'Good',
    Warning = 'Warning',
    Danger = 'Danger',
}
export const RISK_MAX_LEVEL_GOOD = 25;
export const RISK_MAX_LEVEL_WARNING = 65;

const RUGCHECK_API_KEY = process.env.NEXT_PUBLIC_RUGCHECK_API_KEY;

function getRiskLevel(score: number): ERiskLevel {
    if (score <= RISK_MAX_LEVEL_GOOD) return ERiskLevel.Good;
    if (score <= RISK_MAX_LEVEL_WARNING) return ERiskLevel.Warning;
    return ERiskLevel.Danger;
}

export function useRugCheck(mintAddress?: string): RugCheckResult | undefined {
    const { cluster } = useCluster();
    const [result, setResult] = React.useState<RugCheckResult>();

    React.useEffect(() => {
        if (!mintAddress || cluster !== Cluster.MainnetBeta) {
            return;
        }

        const cacheKey = createCacheKey(EVerificationSource.RugCheck, mintAddress);
        const cached = getFromCache<RugCheckResult>(cacheKey);
        if (cached) {
            setResult(cached);
            return;
        }

        let stale = false;

        const checkRisk = async () => {
            setResult({ status: RugCheckStatus.Loading, score: 0 });

            try {
                const headers: HeadersInit = RUGCHECK_API_KEY ? { 'x-api-key': RUGCHECK_API_KEY } : {};
                const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report`, { headers });

                if (stale) return;

                if (!response.ok) {
                    setResult({ status: RugCheckStatus.FetchFailed, score: 0 });
                    return;
                }

                const data = await response.json();
                const score = data.score_normalised;
                const res: RugCheckResult = { status: RugCheckStatus.Success, score };

                setToCache(cacheKey, res);
                setResult(res);
            } catch {
                setResult({ status: RugCheckStatus.FetchFailed, score: 0 });
            }
        };

        checkRisk();

        return () => {
            stale = true;
        };
    }, [mintAddress, cluster]);

    return result;
}

export { getRiskLevel };
