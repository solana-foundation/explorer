// TODO(HOO-1670): replaces the MCP copy in packages/entity-inspector/src/transactions/account-resolver.ts.
// Delete that file once MCP resolves accounts through this module.
import type { Address } from '@solana/kit';

import type { AddressTableLookup, TransactionAccount, TransactionVersion } from './types.js';

type MessageHeader = {
    numReadonlyNonSignerAccounts: number;
    numReadonlySignerAccounts: number;
    numSignerAccounts: number;
};

export type AccountResolutionParams = {
    addressTableLookups?: readonly AddressTableLookup[];
    header: MessageHeader;
    loadedAddresses?: { readonly: readonly Address[]; writable: readonly Address[] } | null;
    staticKeys: readonly Address[];
    version: TransactionVersion;
};

export type AccountResolutionResult = {
    accounts: TransactionAccount[];
    /** Loaded addresses missing from every listed lookup table. Absent when the encoding omits them. */
    unmatchedLookupTableAddresses?: readonly Address[];
    /** Lookup table indexes which are not matched by any loaded addresses. Absent when the encoding omits the tables. */
    unmatchedLookupTableIndexes?: readonly AddressTableLookup[];
};

/**
 * Only v0 can load addresses from lookup tables.
 * Legacy and v1 resolve their static keys alone.
 */
export function resolveAccounts(params: AccountResolutionParams): AccountResolutionResult {
    const staticAccounts = resolveStaticAccounts(params.staticKeys, params.header);
    if (params.version !== 0) {
        return { accounts: staticAccounts };
    }

    const loadedWritable = params.loadedAddresses?.writable ?? [];
    const loadedReadonly = params.loadedAddresses?.readonly ?? [];
    const lookupIndexes = flattenLookupTables(params.addressTableLookups);
    const lookupSlotCount = lookupIndexes.writable.length + lookupIndexes.readonly.length;

    // Empty lists mean the tables loaded nothing. Absent ones mean the caller never resolved the tables.
    if (!params.loadedAddresses && lookupSlotCount > 0) {
        throw new Error(
            `Missing loadedAddresses: the v0 message loads ${lookupSlotCount} accounts from lookup tables. ` +
                `Resolve the tables and pass the addresses they load.`,
        );
    }

    const accounts = [
        ...staticAccounts,
        ...loadedWritable.map((address, i) => toLoadedAccount(address, tableAt(lookupIndexes.writable, i), true)),
        ...loadedReadonly.map((address, i) => toLoadedAccount(address, tableAt(lookupIndexes.readonly, i), false)),
    ];

    if (params.addressTableLookups === undefined) {
        return { accounts };
    }

    const unmatchedAddresses = [
        ...loadedWritable.slice(lookupIndexes.writable.length),
        ...loadedReadonly.slice(lookupIndexes.readonly.length),
    ];
    const unmatchedIndexes = findUnmatchedLookupIndexes(lookupIndexes, loadedWritable.length, loadedReadonly.length);

    return {
        accounts,
        ...(unmatchedAddresses.length > 0 && { unmatchedLookupTableAddresses: unmatchedAddresses }),
        ...(unmatchedIndexes.length > 0 && { unmatchedLookupTableIndexes: unmatchedIndexes }),
    };
}

function resolveStaticAccounts(staticKeys: readonly Address[], header: MessageHeader): TransactionAccount[] {
    const { numReadonlyNonSignerAccounts, numReadonlySignerAccounts, numSignerAccounts } = header;
    const readonlySignerStart = numSignerAccounts - numReadonlySignerAccounts;
    const readonlyNonSignerStart = staticKeys.length - numReadonlyNonSignerAccounts;

    return staticKeys.map((address, i) => {
        const signer = i < numSignerAccounts;
        const readonlySigned = signer && i >= readonlySignerStart;
        const readonlyNonSigned = !signer && i >= readonlyNonSignerStart;

        return { address, signer, source: 'static' as const, writable: !readonlySigned && !readonlyNonSigned };
    });
}

type LookupTableIndex = { lookupTableAddress: Address; index: number };
type FlattenedLookupTables = { readonly: LookupTableIndex[]; writable: LookupTableIndex[] };

/**
 * Lists every lookup table index in the order Solana loads them.
 * Each list joins the tables' indexes in table order, so position `i` lines up with `loadedAddresses`.
 */
function flattenLookupTables(addressTableLookups: readonly AddressTableLookup[] | undefined): FlattenedLookupTables {
    const readonly: LookupTableIndex[] = [];
    const writable: LookupTableIndex[] = [];

    for (const lookup of addressTableLookups ?? []) {
        for (const index of lookup.writableIndexes) writable.push({ index, lookupTableAddress: lookup.accountKey });
        for (const index of lookup.readonlyIndexes) readonly.push({ index, lookupTableAddress: lookup.accountKey });
    }

    return { readonly, writable };
}

/** A loaded address past the last lookup table index has no table to attribute. */
function tableAt(indexes: readonly LookupTableIndex[], position: number): Address | undefined {
    return position < indexes.length ? indexes[position].lookupTableAddress : undefined;
}

/** Lookup table indexes which are not matched by any loaded addresses. */
function findUnmatchedLookupIndexes(
    lookupIndexes: FlattenedLookupTables,
    loadedWritableCount: number,
    loadedReadonlyCount: number,
): AddressTableLookup[] {
    const tables = new Map<Address, { readonlyIndexes: number[]; writableIndexes: number[] }>();
    const indexesOf = (lookupTableAddress: Address) => {
        const existing = tables.get(lookupTableAddress);
        if (existing) return existing;
        const created: { readonlyIndexes: number[]; writableIndexes: number[] } = {
            readonlyIndexes: [],
            writableIndexes: [],
        };
        tables.set(lookupTableAddress, created);
        return created;
    };

    for (const entry of lookupIndexes.writable.slice(loadedWritableCount)) {
        indexesOf(entry.lookupTableAddress).writableIndexes.push(entry.index);
    }
    for (const entry of lookupIndexes.readonly.slice(loadedReadonlyCount)) {
        indexesOf(entry.lookupTableAddress).readonlyIndexes.push(entry.index);
    }

    return [...tables].map(([lookupTableAddress, indexes]) => ({ accountKey: lookupTableAddress, ...indexes }));
}

function toLoadedAccount(
    address: Address,
    lookupTableAddress: Address | undefined,
    writable: boolean,
): TransactionAccount {
    return {
        address,
        signer: false,
        source: 'lookupTable',
        writable,
        ...(lookupTableAddress !== undefined && { lookupTableAddress }),
    };
}
