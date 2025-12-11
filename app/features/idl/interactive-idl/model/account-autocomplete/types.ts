/**
 * Types for account autocomplete items.
 *
 * These types define the contract for autocomplete items used in the
 * interactive IDL feature. The UI layer implements this contract.
 */
export type AutocompleteItem = {
    /** The actual Solana public key address in base58 format. This is what gets inserted when the user selects the item. */
    value: string;
    /** Human-readable name displayed to users in the autocomplete dropdown. */
    label: string;
    /** Indicates that the item is a generated PDA. */
    generated?: boolean;
    /**
     * Used to categorize items in the autocomplete dropdown. Common groups include:
     * - `'Program'` - For Solana native programs
     * - `'Sysvar'` - For system variables
     * - `undefined` - For items that shouldn't be grouped
     */
    group?: string;
    /** Optional array of strings used for search/filtering. If not provided, the autocomplete will still work but may be less discoverable via search. */
    keywords?: string[];
};
