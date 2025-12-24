import type { AutocompleteItem } from './types';

/**
 * Default list of common Solana programs for autocomplete suggestions.
 *
 * This list can be extended by adding new items to the array. Each item should follow
 * the `AutocompleteItem` type structure with appropriate `group`, `keywords`, `label`, and `value`.
 *
 * @see AutocompleteItem for field descriptions
 */
export const DEFAULT_AUTOCOMPLETE_ITEMS: AutocompleteItem[] = [
    {
        group: 'Program',
        keywords: ['system'],
        label: 'System',
        value: '11111111111111111111111111111111',
    },
    {
        group: 'Program',
        label: 'Address Lookup Table',
        value: 'AddressLookupTab1e1111111111111111111111111',
    },
    { group: 'Program', label: 'Compute Budget', value: 'ComputeBudget111111111111111111111111111111' },
    { group: 'Program', label: 'Config', value: 'Config1111111111111111111111111111111111111' },
    { group: 'Sysvar', label: 'Clock', value: 'SysvarC1ock11111111111111111111111111111111' },
];
