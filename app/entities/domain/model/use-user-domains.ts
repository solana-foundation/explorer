'use client';

import { getFilteredProgramAccounts, NAME_PROGRAM_ID, performReverseLookup } from '@bonfida/spl-name-service';
import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import useSWR, { SWRResponse } from 'swr';

import { SOL_TLD_AUTHORITY } from './const';
import type { DomainInfo } from './types';

const SUPPORTED_CLUSTERS = [Cluster.MainnetBeta, Cluster.Custom];

/**
 * Fetches SOL (.sol) name service domains owned by the given wallet.
 */
export function useUserDomains(userAddress: string): SWRResponse<DomainInfo[], Error, { revalidateOnFocus: false }> {
    const { url, cluster } = useCluster();
    const swrKey = getUserDomainsSwrKey(cluster, url, userAddress);

    const result = useSWR(swrKey, swrKey ? ([, rpcUrl, address]) => fetchUserDomains(rpcUrl, address) : null, {
        revalidateOnFocus: false,
    });

    return result;
}
async function fetchUserDomains(rpcUrl: string, userAddress: string): Promise<DomainInfo[]> {
    const connection = new Connection(rpcUrl, 'confirmed');
    const addresses = await fetchUserDomainAddresses(connection, userAddress);
    return resolveDomains(connection, addresses);
}

async function fetchUserDomainAddresses(connection: Connection, userAddress: string): Promise<PublicKey[]> {
    const filters = [
        { memcmp: { bytes: SOL_TLD_AUTHORITY.toBase58(), offset: 0 } },
        { memcmp: { bytes: userAddress, offset: 32 } },
    ];
    const accounts = await getFilteredProgramAccounts(connection, NAME_PROGRAM_ID, filters);
    return accounts.map(a => a.publicKey);
}

async function resolveDomains(connection: Connection, addresses: PublicKey[]): Promise<DomainInfo[]> {
    const domains = await Promise.all(
        addresses.map(async address => {
            const domainName = await performReverseLookup(connection, address);
            return { address, name: `${domainName}.sol` };
        })
    );
    return domains.sort((a, b) => a.name.localeCompare(b.name));
}

function getUserDomainsSwrKey(cluster: Cluster, url: string, userAddress: string): [string, string, string] | null {
    if (!userAddress || !SUPPORTED_CLUSTERS.includes(cluster)) {
        return null;
    }
    return ['user-domains', url, userAddress];
}
