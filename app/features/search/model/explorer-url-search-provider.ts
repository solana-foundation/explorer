import { parseExplorerUrl } from '../lib/parse-explorer-url';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that detects pasted URLs from external Solana explorers
 * (e.g. Solscan, Orb Markets) and resolves them to the corresponding local page.
 *
 * Cluster context from the source URL is preserved — the user lands on the
 * correct cluster regardless of which cluster is currently selected.
 *
 * @example
 * // Paste a Solscan URL into the search bar:
 * // https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E?cluster=devnet
 */
export const explorerUrlSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'explorer-url',
    priority: 80,
    search(query: string): SearchOptions[] {
        const result = parseExplorerUrl(query);
        if (!result) return [];

        return [
            {
                label: 'External Explorer',
                options: [
                    {
                        cluster: result.cluster,
                        label: `${result.source} — ${result.entity}`,
                        pathname: result.pathname,
                        type: result.type,
                        value: [query],
                    },
                ],
            },
        ];
    },
};
