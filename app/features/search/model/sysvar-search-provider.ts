import { SYSVAR_IDS } from '@/app/utils/programs';

import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches Solana sysvar accounts by name or
 * address.
 *
 * Sysvars are special read-only accounts maintained by the runtime (e.g.
 * Clock, Rent, StakeHistory). This provider searches the `SYSVAR_IDS`
 * registry so users can quickly navigate to any sysvar's account page.
 *
 * @example
 * // Type "clock" into the search bar:
 * // clock
 */
export const sysvarSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'sysvar',
    priority: 50,
    search(query: string): SearchOptions[] {
        if (query.length < 2) return [];

        const matchedSysvars = Object.entries(SYSVAR_IDS).filter(([address, name]) => {
            return name.toLowerCase().includes(query.toLowerCase()) || address.includes(query);
        });

        if (matchedSysvars.length === 0) return [];

        return [
            {
                label: 'Sysvars',
                options: matchedSysvars.map(([id, name]) => ({
                    label: name,
                    pathname: `/address/${id}`,
                    value: [name, id],
                })),
            },
        ];
    },
};
