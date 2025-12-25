import { AddressLookupTableAccount, PublicKey } from '@solana/web3.js';

import E5Alt from './stubs/E59uBXGqn83xN17kMbBVfU1M7T4wHG91eiygHb88Aovb.json';
import EDAlt from './stubs/EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH.json';
import GDAlt from './stubs/GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV.json';

/**
 * Mock Address Lookup Table data for tests.
 * Keys are ALT account addresses, values are arrays of resolved addresses.
 *
 * To get ALT data, run:
 * ```
 * const connection = new Connection(clusterApiUrl('mainnet-beta'));
 * const result = await connection.getAddressLookupTable(new PublicKey(altKey));
 * console.log(JSON.stringify(result.value.state.addresses.map(a => a.toBase58())));
 * ```
 */
const ALT_DATA: Record<string, string[]> = {
    // Used by computeBudgetMsg
    E59uBXGqn83xN17kMbBVfU1M7T4wHG91eiygHb88Aovb: E5Alt,

    // Used by aTokenCreateIdempotentMsg
    EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH: EDAlt,

    // Used by computeBudgetMsg
    GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV: GDAlt,
};

/**
 * Creates a mock AddressLookupTableAccount from stored ALT data.
 */
function createMockLookupTable(accountKey: PublicKey): AddressLookupTableAccount | null {
    const addresses = ALT_DATA[accountKey.toBase58()];
    if (!addresses) {
        return null;
    }

    return new AddressLookupTableAccount({
        key: accountKey,
        state: {
            addresses: addresses.map(addr => new PublicKey(addr)),
            authority: undefined,
            deactivationSlot: BigInt('18446744073709551615'),
            lastExtendedSlot: 0,
            lastExtendedSlotStartIndex: 0,
        },
    });
}

/**
 * Resolves address lookup tables from mock data instead of making network requests.
 * Drop-in replacement for:
 * ```
 * const connection = new Connection(clusterApiUrl('mainnet-beta'));
 * const lookups = await Promise.all(
 *     m.addressTableLookups.map(lookup =>
 *         connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
 *     )
 * );
 * ```
 *
 * Usage:
 * ```
 * const lookups = resolveAddressLookupTables(m.addressTableLookups);
 * ```
 */
export function resolveAddressLookupTables(
    addressTableLookups: Array<{ accountKey: PublicKey }>
): AddressLookupTableAccount[] {
    return addressTableLookups
        .map(lookup => createMockLookupTable(lookup.accountKey))
        .filter((x): x is AddressLookupTableAccount => x !== null);
}
