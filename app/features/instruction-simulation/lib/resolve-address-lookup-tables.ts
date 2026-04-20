import { AddressLookupTableAccount, type Connection, type VersionedMessage } from '@solana/web3.js';

/**
 * Fetch and deserialize the address lookup tables referenced by a versioned message.
 *
 * Versioned transactions can reference lookup tables to keep the
 * on-wire message compact. We must resolve these tables before we can enumerate
 * every account key involved in the transaction.
 */
export async function resolveAddressLookupTables(
    connection: Connection,
    message: VersionedMessage,
): Promise<AddressLookupTableAccount[]> {
    const lookups = message.addressTableLookups;
    if (lookups.length === 0) return [];

    const keys = lookups.map(lookup => lookup.accountKey);
    const accountInfos = await connection.getMultipleAccountsInfo(keys);

    return accountInfos
        .map((info, i) =>
            info
                ? new AddressLookupTableAccount({
                      key: keys[i],
                      state: AddressLookupTableAccount.deserialize(Uint8Array.from(info.data)),
                  })
                : undefined,
        )
        .filter((table): table is AddressLookupTableAccount => table !== undefined);
}
