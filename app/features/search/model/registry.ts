import { Logger } from '@/app/shared/lib/logger';

import type { SearchProvider, SearchProviderRegistry } from '../lib/types';
import { accountSearchProvider } from './account-search-provider';
import { base64TxSearchProvider } from './base64-tx-search-provider';
import { blockSearchProvider } from './block-search-provider';
import { domainSearchProvider } from './domain-search-provider';
import { epochSearchProvider } from './epoch-search-provider';
import { explorerUrlSearchProvider } from './explorer-url-search-provider';
import { featureGateSearchProvider } from './feature-gate-search-provider';
import { loaderSearchProvider } from './loader-search-provider';
import { programSearchProvider } from './program-search-provider';
import { specialSearchProvider } from './special-search-provider';
import { sysvarSearchProvider } from './sysvar-search-provider';
import { tokenSearchProvider } from './token-search-provider';
import { transactionSearchProvider } from './transaction-search-provider';

const allProviders: SearchProvider[] = [
    ...(process.env.NEXT_PUBLIC_DISABLE_TOKEN_SEARCH ? [] : [tokenSearchProvider]),
    explorerUrlSearchProvider,
    programSearchProvider,
    loaderSearchProvider,
    sysvarSearchProvider,
    specialSearchProvider,
    featureGateSearchProvider,
    blockSearchProvider,
    epochSearchProvider,
    accountSearchProvider,
    transactionSearchProvider,
    base64TxSearchProvider,
    domainSearchProvider,
];

const byPriority = (a: SearchProvider, b: SearchProvider) => b.priority - a.priority;

function buildTier(kind: SearchProvider['kind']): SearchProvider[] {
    const tier = allProviders.filter(p => p.kind === kind).sort(byPriority);

    const seen = new Map<number, string>();
    for (const p of tier) {
        const existing = seen.get(p.priority);
        if (existing) {
            Logger.warn(
                `Providers "${existing}" and "${p.name}" in "${kind}" tier share priority ${p.priority}. ` +
                    'Assign distinct priority values for deterministic display order.',
            );
        }
        seen.set(p.priority, p.name);
    }

    return tier;
}

export const searchProviders: SearchProviderRegistry = {
    fallback: buildTier('fallback'),
    local: buildTier('local'),
    remote: buildTier('remote'),
};
