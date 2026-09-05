import { getBase58Encoder } from '@solana/kit';
import { SIGNATURE_LENGTH_IN_BYTES } from '@solana/web3.js';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchOptions, SearchProvider } from '../lib/types';

const BASE58_ENCODER = getBase58Encoder();

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
            decoded = BASE58_ENCODER.encode(query);
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
