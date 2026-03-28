'use client';

import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import useSWR, { SWRResponse } from 'swr';

import type { DomainInfo } from './types';

export function useUserSnsDomains(userAddress: string): SWRResponse<DomainInfo[], Error, { revalidateOnFocus: false }> {
    const { cluster } = useCluster();
    const enabled = userAddress && (cluster === Cluster.MainnetBeta || cluster === Cluster.Custom);

    return useSWR(enabled ? ['user-sns-domains', userAddress] : null, ([, address]) => fetchSnsDomains(address), {
        revalidateOnFocus: false,
    });
}

type SnsResponse = {
    domains: DomainInfo[];
};

async function fetchSnsDomains(address: string): Promise<DomainInfo[]> {
    const response = await fetch(`/api/sns-domains/${address}`);
    if (!response.ok) throw new Error(`Failed to fetch SNS domains: ${response.status}`);

    const data: SnsResponse = await response.json();
    return (data.domains ?? []).sort((a, b) => a.name.localeCompare(b.name));
}
