import { PUBLIC_KEY_LENGTH } from '@solana/web3.js';
import bs58 from 'bs58';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Fallback search provider that matches valid Solana account addresses.
 *
 * When a user types a base-58 string into the search bar that decodes to
 * exactly 32 bytes (the length of a Solana public key), this provider offers
 * a link to the account's detail page (`/address/<pubkey>`). It acts as a
 * fallback so that any valid public key can be looked up even if no
 * higher-priority provider (e.g. token, program, sysvar) claims it first.
 *
 * @example
 * // Try pasting the SOL token mint into the search bar:
 * // So11111111111111111111111111111111111111112
 */
export const accountSearchProvider: SearchProvider = {
    kind: 'fallback',
    name: 'account',
    priority: 30,
    search(query: string): SearchOptions[] {
        let decoded;
        try {
            decoded = bs58.decode(query);
        } catch {
            return [];
        }

        if (decoded.length !== PUBLIC_KEY_LENGTH) return [];

        return [
            {
                label: SearchGroup.Accounts,
                options: [
                    {
                        label: query,
                        pathname: `/address/${query}`,
                        type: 'address',
                        value: [query],
                    },
                ],
            },
        ];
    },
};
