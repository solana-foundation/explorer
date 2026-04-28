import { SIGNATURE_LENGTH_IN_BYTES } from '@solana/web3.js';
import bs58 from 'bs58';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Fallback search provider that matches valid Solana transaction signatures.
 *
 * When a user types a base-58 string that decodes to exactly 64 bytes (the
 * length of an Ed25519 signature), this provider offers a link to the
 * transaction detail page (`/tx/<signature>`).
 *
 * @example
 * // Paste a transaction signature into the search bar:
 * // 5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQU
 */
export const transactionSearchProvider: SearchProvider = {
    kind: 'fallback',
    name: 'transaction',
    priority: 20,
    search(query: string): SearchOptions[] {
        let decoded;
        try {
            decoded = bs58.decode(query);
        } catch {
            return [];
        }

        if (decoded.length !== SIGNATURE_LENGTH_IN_BYTES) return [];

        return [
            {
                label: SearchGroup.Transactions,
                options: [
                    {
                        label: query,
                        pathname: `/tx/${query}`,
                        type: 'tx',
                        value: [query],
                    },
                ],
            },
        ];
    },
};
