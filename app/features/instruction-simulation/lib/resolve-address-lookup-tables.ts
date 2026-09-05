import type { SolanaRpc } from '@entities/cluster';
import { isSome } from '@solana/kit';
import { AddressLookupTableAccount, type VersionedMessage } from '@solana/web3.js';
import { fetchAllMaybeAddressLookupTable } from '@solana-program/address-lookup-table';

import { toKitAddress, toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

/**
 * Fetch and deserialize the address lookup tables referenced by a versioned message.
 *
 * Versioned transactions can reference lookup tables to keep the
 * on-wire message compact. We must resolve these tables before we can enumerate
 * every account key involved in the transaction.
 *
 * Throws when a referenced table cannot be loaded. Returning a partial list instead would leave
 * `message.getAccountKeys` to notice — it throws a generic "Failed to find address lookup table
 * account", losing both which table failed and why, and only for as long as web3.js keeps validating.
 * `useSimulation` renders this message to the user, so the reason has to be in it.
 */
export async function resolveAddressLookupTables(
    rpc: SolanaRpc,
    message: VersionedMessage,
): Promise<AddressLookupTableAccount[]> {
    const lookups = message.addressTableLookups;
    if (lookups.length === 0) return [];

    const keys = lookups.map(lookup => lookup.accountKey);
    const accounts = await fetchAllMaybeAddressLookupTable(
        rpc,
        keys.map(key => toKitAddress(key)),
        { commitment: 'confirmed' },
    );

    return accounts.map((account, i) => {
        if (!account.exists) {
            throw new Error(
                `Address lookup table ${keys[i].toBase58()} could not be loaded: the RPC returned no account ` +
                    `for it. The table may have been closed, or this RPC may not carry it.`,
            );
        }
        const { addresses, authority, deactivationSlot, lastExtendedSlot, lastExtendedSlotStartIndex } = account.data;
        return new AddressLookupTableAccount({
            key: keys[i],
            state: {
                addresses: addresses.map(address => toLegacyPublicKey(address)),
                authority: isSome(authority) ? toLegacyPublicKey(authority.value) : undefined,
                deactivationSlot,
                lastExtendedSlot: Number(lastExtendedSlot),
                lastExtendedSlotStartIndex,
            },
        });
    });
}
