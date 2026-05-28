import { PROGRAM_INFO_BY_ID } from '@/app/utils/programs';
import verifiedPrograms from '@/public/verified-programs.json';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchContext, SearchOptions, SearchProvider } from '../lib/types';

const verifiedAddresses = new Set(verifiedPrograms.map((p: { address: string }) => p.address));

/**
 * Local search provider that matches well-known Solana programs by name or
 * address.
 *
 * Searches the built-in `PROGRAM_INFO_BY_ID` registry and returns programs
 * that are deployed on the currently selected cluster. Useful for quickly
 * navigating to native and popular programs.
 *
 * @example
 * // Type a program name into the search bar:
 * // Token
 */
export const programSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'program',
    priority: 70,
    search(query: string, ctx: SearchContext): SearchOptions[] {
        if (query.length < 2) return [];

        const matchedPrograms = Object.entries(PROGRAM_INFO_BY_ID).filter(([address, { name, deployments }]) => {
            if (!deployments.includes(ctx.cluster)) return false;
            return name.toLowerCase().includes(query.toLowerCase()) || address.includes(query);
        });

        if (matchedPrograms.length === 0) return [];

        return [
            {
                label: SearchGroup.Programs,
                options: matchedPrograms.map(([address, { name }]) => ({
                    label: name,
                    pathname: `/address/${address}`,
                    sublabel: address,
                    type: 'address',
                    value: [name, address],
                    ...(verifiedAddresses.has(address) && { verified: true }),
                })),
            },
        ];
    },
};
