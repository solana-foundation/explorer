'use client';

import { NameRecordHeader, TldParser } from '@onsol/tldparser';
import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import pLimit from 'p-limit';
import useSWR, { SWRResponse } from 'swr';

import type { DomainInfo } from './types';

const SUPPORTED_CLUSTERS = [Cluster.MainnetBeta, Cluster.Custom];

/**
 * Fetches ANS (All Domains) name service domains owned by the given wallet.
 */
export function useUserANSDomains(userAddress: string): SWRResponse<DomainInfo[], Error, { revalidateOnFocus: false }> {
    const { url, cluster } = useCluster();
    const swrKey = getUserANSDomainsSwrKey(cluster, url, userAddress);

    const result = useSWR(swrKey, swrKey ? ([, rpcUrl, address]) => fetchUserANSDomains(rpcUrl, address) : null, {
        revalidateOnFocus: false,
    });

    return result;
}

async function fetchUserANSDomains(rpcUrl: string, userAddress: string): Promise<DomainInfo[]> {
    const connection = new Connection(rpcUrl, 'confirmed');
    const parser = new TldParser(connection);
    const allDomains = await parser.getAllUserDomains(userAddress);

    if (!allDomains?.length) {
        return [];
    }
    return resolveAnsDomains(connection, parser, allDomains);
}

async function resolveAnsDomains(
    connection: Connection,
    parser: TldParser,
    addresses: PublicKey[]
): Promise<DomainInfo[]> {
    const userDomains: DomainInfo[] = [];
    const limit = pLimit(5);

    const promises = addresses.map(address =>
        limit(async () => {
            const domainRecord = await NameRecordHeader.fromAccountAddress(connection, address);
            if (!domainRecord?.owner) return;

            const domainParentNameAccount = await NameRecordHeader.fromAccountAddress(
                connection,
                domainRecord.parentName
            );
            if (!domainParentNameAccount?.owner) return;

            const tld = await parser.getTldFromParentAccount(domainRecord.parentName);
            const domain = await parser.reverseLookupNameAccount(address, domainParentNameAccount.owner);
            if (!domain) return;

            userDomains.push({ address, name: `${domain}${tld}` });
        })
    );

    await Promise.all(promises);
    return userDomains.sort((a, b) => a.name.localeCompare(b.name));
}

function getUserANSDomainsSwrKey(cluster: Cluster, url: string, userAddress: string): [string, string, string] | null {
    if (!userAddress || !SUPPORTED_CLUSTERS.includes(cluster)) {
        return null;
    }
    return ['user-ans-domains', url, userAddress];
}
