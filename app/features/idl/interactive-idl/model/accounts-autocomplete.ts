import type { PublicKey } from '@solana/web3.js';

type AccountName = string;
export function createGetAutocompleteItems(deps: {
    pdas: Record<AccountName, string | null>;
    publicKey: PublicKey | null;
}) {
    const { pdas, publicKey } = deps;

    const getAutocompleteItems = (accountName: string) => {
        const autocompleteItems = getFixedItems();

        const pdaSuggestion = pdas[accountName];
        if (pdaSuggestion) {
            autocompleteItems.push({
                group: undefined,
                keywords: [accountName],
                label: 'Generated PDA',
                value: pdaSuggestion,
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

function getFixedItems() {
    return [
        {
            group: 'Program' as string | undefined,
            keywords: ['system'],
            label: 'System Program',
            value: '11111111111111111111111111111111',
        },
        {
            group: 'Program',
            label: 'Address Lookup Table Program',
            value: 'AddressLookupTab1e1111111111111111111111111',
        },
        { group: 'Program', label: 'Compute Budget Program', value: 'ComputeBudget111111111111111111111111111111' },
        { group: 'Program', label: 'Config Program', value: 'Config1111111111111111111111111111111111111' },
        { group: 'Sysvar', label: 'Clock', value: 'SysvarC1ock11111111111111111111111111111111' },
    ];
}
