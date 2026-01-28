'use client';

import { useUserANSDomains, useUserDomains } from '@entities/domain';

function primaryDomain(sol: { name: string }[] | null, ans: { name: string }[] | null): string | undefined {
    const solFirst = sol?.length ? [...sol].sort((a, b) => a.name.localeCompare(b.name))[0]?.name : undefined;
    const ansFirst = ans?.length ? [...ans].sort((a, b) => a.name.localeCompare(b.name))[0]?.name : undefined;
    return solFirst ?? ansFirst;
}

export function usePrimaryDomain(address: string): string | undefined {
    const { data: sol } = useUserDomains(address);
    const { data: ans } = useUserANSDomains(address);
    return primaryDomain(sol ?? null, ans ?? null);
}
