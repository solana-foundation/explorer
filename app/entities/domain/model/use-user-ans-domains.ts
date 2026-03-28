'use client';

import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import useSWR, { SWRResponse } from 'swr';

import type { DomainInfo } from './types';

export function useUserANSDomains(userAddress: string): SWRResponse<DomainInfo[], Error, { revalidateOnFocus: false }> {
    const { cluster } = useCluster();
    const enabled = userAddress && (cluster === Cluster.MainnetBeta || cluster === Cluster.Custom);

    return useSWR(enabled ? ['user-ans-domains', userAddress] : null, ([, address]) => fetchAnsDomains(address), {
        revalidateOnFocus: false,
    });
}

type AnsResponse = {
    domains: { address: string; name: string }[];
};

async function fetchAnsDomains(address: string): Promise<DomainInfo[]> {
    const response = await fetch(`/api/ans-domains/${address}`);
    if (!response.ok) throw new Error(`Failed to fetch ANS domains: ${response.status}`);

    const data: AnsResponse = await response.json();
    return (data.domains ?? []).sort((a, b) => a.name.localeCompare(b.name));
}
