import { LOADER_IDS, type LoaderName } from '@/app/utils/programs';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchOptions, SearchProvider } from '../lib/types';

const SEARCHABLE_LOADERS: LoaderName[] = ['BPF Loader', 'BPF Loader 2', 'BPF Upgradeable Loader'];

/**
 * Local search provider that matches Solana BPF program loaders by name or
 * address.
 *
 * Searches the built-in `LOADER_IDS` registry for the three user-facing
 * loaders (BPF Loader, BPF Loader 2, BPF Upgradeable Loader) and returns
 * links to their account pages.
 *
 * @example
 * // Type "bpf" into the search bar to see all loaders:
 * // bpf
 */
export const loaderSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'loader',
    priority: 60,
    search(query: string): SearchOptions[] {
        if (query.length < 2) return [];

        const matchedLoaders = Object.entries(LOADER_IDS).filter(([address, name]) => {
            return (
                SEARCHABLE_LOADERS.includes(name) &&
                (name.toLowerCase().includes(query.toLowerCase()) || address.includes(query))
            );
        });

        if (matchedLoaders.length === 0) return [];

        return [
            {
                label: SearchGroup.ProgramLoaders,
                options: matchedLoaders.map(([id, name]) => ({
                    label: name,
                    pathname: `/address/${id}`,
                    sublabel: id,
                    type: 'address',
                    value: [name, id],
                })),
            },
        ];
    },
};
