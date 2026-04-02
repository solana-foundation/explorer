import { SPECIAL_IDS } from '@/app/utils/programs';

import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches special / well-known Solana accounts by
 * name or address.
 *
 * Covers notable accounts that are not programs, loaders, or sysvars (e.g.
 * the native mint, stake config). Searches the `SPECIAL_IDS` registry.
 *
 * @example
 * // Type "incinerator" into the search bar:
 * // incinerator
 */
export const specialSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'special',
    priority: 40,
    search(query: string): SearchOptions[] {
        if (query.length < 2) return [];

        const matchedSpecialIds = Object.entries(SPECIAL_IDS).filter(([address, name]) => {
            return name.toLowerCase().includes(query.toLowerCase()) || address.includes(query);
        });

        if (matchedSpecialIds.length === 0) return [];

        return [
            {
                label: 'Accounts',
                options: matchedSpecialIds.map(([id, name]) => ({
                    label: name,
                    pathname: `/address/${id}`,
                    value: [name, id],
                })),
            },
        ];
    },
};
