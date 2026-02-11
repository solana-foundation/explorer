'use client';

import { useUserANSDomains, useUserDomains } from '@entities/domain';

export function usePrimaryDomain(address: string): string | undefined {
    const { data: sol } = useUserDomains(address);
    const { data: ans } = useUserANSDomains(address);
    return primaryDomain(sol ?? null, ans ?? null);
}

function primaryDomain(sol: { name: string }[] | null, ans: { name: string }[] | null): string | undefined {
    return firstSortedName(sol) ?? firstSortedName(ans);
}

function firstSortedName(items: { name: string }[] | null): string | undefined {
    return items?.length ? [...items].sort((a, b) => a.name.localeCompare(b.name))[0]?.name : undefined;
}
