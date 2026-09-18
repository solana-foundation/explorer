import { type AddressLookupTableAccount, type VersionedMessage } from '@solana/web3.js';

// The caller resolves a table to a string when it cannot parse one, and to undefined while it loads.
type ResolvedLookupTable = readonly [AddressLookupTableAccount | string | undefined, unknown] | undefined;

/**
 * Every account a message references, in row order and without repeats. A key that is both static and
 * looked up must not be counted twice in a caller's size total.
 */
export function rowAddresses(message: VersionedMessage, lookupTables: readonly ResolvedLookupTable[]): string[] {
    const addresses = new Set(message.staticAccountKeys.map(pubkey => pubkey.toBase58()));

    message.addressTableLookups.forEach((lookup, tableIndex) => {
        const entry = lookupTables[tableIndex];
        if (!isResolvedLookupTable(entry)) return;

        for (const index of [...lookup.writableIndexes, ...lookup.readonlyIndexes]) {
            const address = entry[0].state.addresses[index];
            if (address) addresses.add(address.toBase58());
        }
    });

    return Array.from(addresses);
}

/** A table that contributes addresses. Everything else the caller resolves to carries none. */
export function isResolvedLookupTable(
    table: ResolvedLookupTable,
): table is readonly [AddressLookupTableAccount, unknown] {
    return table !== undefined && table[0] !== undefined && typeof table[0] !== 'string';
}
