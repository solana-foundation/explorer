import { parseNaturalNumber } from '../lib/parse-natural-number';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches numeric queries to Solana block slots.
 *
 * Any purely numeric input is treated as a potential slot number and offered
 * as a link to the block detail page (`/block/<slot>`).
 *
 * @example
 * // Type a slot number into the search bar:
 * // 300000000
 */
export const blockSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'block',
    priority: 20,
    search(query: string): SearchOptions[] {
        if (parseNaturalNumber(query) === undefined) return [];

        return [
            {
                label: 'Blocks',
                options: [
                    {
                        label: `Slot #${query}`,
                        pathname: `/block/${query}`,
                        value: [query],
                    },
                ],
            },
        ];
    },
};
