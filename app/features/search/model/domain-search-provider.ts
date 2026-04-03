import { Domain, ResolvedDomainInfoSchema } from '@entities/domain';
import { Cluster } from '@utils/cluster';
import { is } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import type { SearchContext, SearchOptions, SearchProvider } from '../lib/types';

const SEARCH_TIMEOUT_MS = 5_000;

/**
 * Remote search provider that resolves Solana domain names (SNS / Bonfida).
 *
 * When the query looks like a valid `.sol` domain and the cluster is
 * mainnet-beta, this provider fetches the domain info from the API and
 * returns links to both the domain owner's account and the name-service
 * account itself.
 *
 * @example
 * // Type a .sol domain into the search bar (mainnet only):
 * // toly.sol
 */
export const domainSearchProvider: SearchProvider = {
    kind: 'remote',
    name: 'domain',
    priority: 30,
    async search(query: string, ctx: SearchContext): Promise<SearchOptions[]> {
        if (ctx.cluster !== Cluster.MainnetBeta || !is(query, Domain)) {
            return [];
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

        try {
            const domainInfoResponse = await fetch(`/api/domain-info/${query}`, { signal: controller.signal });

            if (!domainInfoResponse.ok) return [];

            const domainInfo: unknown = await domainInfoResponse.json();

            if (!is(domainInfo, ResolvedDomainInfoSchema) || !domainInfo) return [];

            return [
                {
                    label: 'Domain Owner',
                    options: [
                        {
                            label: domainInfo.owner,
                            pathname: `/address/${domainInfo.owner}`,
                            value: [query],
                        },
                    ],
                },
                {
                    label: 'Name Service Account',
                    options: [
                        {
                            label: query,
                            pathname: `/address/${domainInfo.address}`,
                            value: [query],
                        },
                    ],
                },
            ];
        } catch (error) {
            Logger.error(new Error('Domain search request failed', { cause: error }), { query });
            return [];
        } finally {
            clearTimeout(timeoutId);
        }
    },
};
