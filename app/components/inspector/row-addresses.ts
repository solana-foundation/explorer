import { type AddressLookupTableAccount, type VersionedMessage } from '@solana/web3.js';

// A resolved lookup table is a string when the provider could not parse one, and undefined while it is
// still loading. Both mean the same thing here: the table contributes no rows yet.
type ResolvedLookupTable = readonly [AddressLookupTableAccount | string | undefined, unknown] | undefined;

/**
 * Addresses of every row the Account List renders, in row order and without repeats. A key that is both
 * static and looked up must not be counted twice in the size total.
 */
export function rowAddresses(message: VersionedMessage, lookupTables: readonly ResolvedLookupTable[]): string[] {
    const addresses = new Set(message.staticAccountKeys.map(pubkey => pubkey.toBase58()));

    message.addressTableLookups.forEach((lookup, tableIndex) => {
        const table = lookupTables[tableIndex]?.[0];
        if (table === undefined || typeof table === 'string') return;

        for (const index of [...lookup.writableIndexes, ...lookup.readonlyIndexes]) {
            const address = table.state.addresses[index];
            if (address) addresses.add(address.toBase58());
        }
    });

    return Array.from(addresses);
}
