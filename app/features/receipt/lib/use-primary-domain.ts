'use client';

import { useUserANSDomains, useUserSnsDomains } from '@entities/domain';

export function usePrimaryDomain(address: string): string | undefined {
    const { data: sns } = useUserSnsDomains(address);
    const snsEmpty = Array.isArray(sns) && sns.length === 0;
    // Waterfall is intentional: SNS resolves via Bonfida REST API (fast, ~100ms),
    // while ANS requires multiple on-chain RPC calls (slow). Avoid the expensive
    // ANS fetch entirely when SNS already has a domain to display.
    const { data: ans } = useUserANSDomains(snsEmpty ? address : '');
    return firstSortedName(sns ?? null) ?? firstSortedName(ans ?? null);
}

function firstSortedName(items: { name: string }[] | null): string | undefined {
    return items?.length ? [...items].sort((a, b) => a.name.localeCompare(b.name))[0]?.name : undefined;
}
