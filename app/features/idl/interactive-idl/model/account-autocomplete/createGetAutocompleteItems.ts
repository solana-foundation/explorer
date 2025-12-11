import type { PublicKey } from '@solana/web3.js';

import { DEFAULT_AUTOCOMPLETE_ITEMS } from './const';
import type { AutocompleteItem } from './types';

type AccountName = string;
export function createGetAutocompleteItems(deps: {
    pdas: Record<AccountName, { generated: string | null; seeds: { value: string | null; name: string }[] }>;
    publicKey: PublicKey | null;
    defaultItems?: AutocompleteItem[];
}) {
    const { pdas, publicKey, defaultItems = DEFAULT_AUTOCOMPLETE_ITEMS } = deps;

    const getAutocompleteItems = (accountName: string) => {
        const autocompleteItems = [...defaultItems];
        const pdaData = pdas[accountName];
        if (pdaData) {
            autocompleteItems.push({
                generated: true,
                group: undefined,
                keywords: [accountName],
                label: 'PDA (generated)',
                value: pdaData.generated ?? '',
            });
        }

        if (publicKey) {
            autocompleteItems.push({
                group: undefined,
                keywords: ['wallet'],
                label: 'Your wallet',
                value: publicKey.toBase58(),
            });
        }
        return autocompleteItems;
    };

    return getAutocompleteItems;
}
