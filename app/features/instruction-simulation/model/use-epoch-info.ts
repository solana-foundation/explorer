'use client';

import { useCluster } from '@providers/cluster';
import { Connection } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

/**
 * Hook that fetches and caches the current epoch info using SWR.
 * The epoch is cached per cluster URL and deduplicated across components.
 */
export function useEpochInfo() {
    const { url } = useCluster();

    const { data, error, isLoading } = useSWRImmutable(['epoch-info', url], async ([, rpcUrl]) => {
        const connection = new Connection(rpcUrl, 'confirmed');
        const epochInfo = await connection.getEpochInfo();
        return epochInfo.epoch;
    });

    return {
        epoch: data,
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
        isLoading,
    };
}
