import { parseNaturalNumber } from '../lib/parse-natural-number';
import type { SearchContext, SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches numeric queries to Solana epochs.
 *
 * A numeric input is offered as an epoch link only if it does not exceed the
 * current epoch + 1 (to avoid nonsensical results). Requires the current
 * epoch to be available in the search context.
 *
 * @example
 * // Type an epoch number into the search bar:
 * // 600
 */
export const epochSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'epoch',
    priority: 10,
    search(query: string, ctx: SearchContext): SearchOptions[] {
        const n = parseNaturalNumber(query);
        if (n === undefined) return [];
        if (ctx.currentEpoch === undefined) return [];
        if (BigInt(n) > ctx.currentEpoch + 1n) return [];

        return [
            {
                label: 'Epoch',
                options: [
                    {
                        label: `Epoch #${query}`,
                        pathname: `/epoch/${query}`,
                        value: [query],
                    },
                ],
            },
        ];
    },
};
