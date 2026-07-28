// Ported from the solana-mcp-official fork (feat/account-resolver): classifies static message keys
// by header counts and grafts v0 lookup-table addresses with per-address source attribution.
import type { AddressTableLookup } from '../rpc/types.js';
import type { ResolvedAccount, TransactionVersion } from './types.js';

type MessageHeader = {
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
};

type LoadedAddresses = {
    readonly writable: readonly string[];
    readonly readonly: readonly string[];
};

export type AccountResolutionParams = {
    staticKeys: string[];
    header: MessageHeader;
    loadedAddresses?: LoadedAddresses | null;
    addressTableLookups?: readonly AddressTableLookup[];
};

export type AccountResolutionResult = {
    accountKeys: string[];
    resolvedAccounts: ResolvedAccount[];
    /** Set when `addressTableLookups` index counts do not cover `loadedAddresses` — attribution is partial. */
    lookupCountsMismatch?: true;
};

type TransactionAccountResolver = (params: AccountResolutionParams) => AccountResolutionResult;

function classifyStaticKeys(staticKeys: string[], header: MessageHeader): ResolvedAccount[] {
    const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = header;
    const readonlySignerStart = numRequiredSignatures - numReadonlySignedAccounts;
    const readonlyUnsignedStart = staticKeys.length - numReadonlyUnsignedAccounts;

    return staticKeys.map((address, i) => {
        const signer = i < numRequiredSignatures;
        const readonlySigned = signer && i >= readonlySignerStart;
        const readonlyUnsigned = !signer && i >= readonlyUnsignedStart;
        const writable = !readonlySigned && !readonlyUnsigned;
        return { address, signer, source: 'static', writable };
    });
}

/**
 * Build a mapping from loaded address position to its source ALT account.
 *
 * `addressTableLookups` entries are ordered — their writable/readonly counts correspond 1:1 with
 * the flattened `loadedAddresses.writable` and `loadedAddresses.readonly` arrays respectively.
 */
function buildLookupTableMap(addressTableLookups: readonly AddressTableLookup[] | undefined): {
    writableMap: string[];
    readonlyMap: string[];
} {
    const writableMap: string[] = [];
    const readonlyMap: string[] = [];

    if (!addressTableLookups) {
        return { readonlyMap, writableMap };
    }

    for (const lookup of addressTableLookups) {
        for (let i = 0; i < lookup.writableIndexes.length; i++) {
            writableMap.push(lookup.accountKey);
        }
        for (let i = 0; i < lookup.readonlyIndexes.length; i++) {
            readonlyMap.push(lookup.accountKey);
        }
    }

    return { readonlyMap, writableMap };
}

export function resolveStaticAccounts(params: AccountResolutionParams): AccountResolutionResult {
    const { staticKeys, header } = params;
    return {
        accountKeys: staticKeys,
        resolvedAccounts: classifyStaticKeys(staticKeys, header),
    };
}

export function resolveV0Accounts(params: AccountResolutionParams): AccountResolutionResult {
    const { staticKeys, header, loadedAddresses, addressTableLookups } = params;
    const staticAccounts = classifyStaticKeys(staticKeys, header);

    const loadedWritable = loadedAddresses?.writable ?? [];
    const loadedReadonly = loadedAddresses?.readonly ?? [];

    const { writableMap, readonlyMap } = buildLookupTableMap(addressTableLookups);

    const loadedWritableAccounts: ResolvedAccount[] = loadedWritable.map((address, i) => ({
        address,
        signer: false,
        source: 'lookupTable',
        writable: true,
        ...(writableMap[i] != null && { lookupTableAddress: writableMap[i] }),
    }));

    const loadedReadonlyAccounts: ResolvedAccount[] = loadedReadonly.map((address, i) => ({
        address,
        signer: false,
        source: 'lookupTable',
        writable: false,
        ...(readonlyMap[i] != null && { lookupTableAddress: readonlyMap[i] }),
    }));

    const lookupCountsMismatch =
        addressTableLookups !== undefined &&
        (writableMap.length !== loadedWritable.length || readonlyMap.length !== loadedReadonly.length);

    return {
        accountKeys: [...staticKeys, ...loadedWritable, ...loadedReadonly],
        resolvedAccounts: [...staticAccounts, ...loadedWritableAccounts, ...loadedReadonlyAccounts],
        ...(lookupCountsMismatch ? { lookupCountsMismatch: true } : {}),
    };
}

export function selectAccountResolver(version: TransactionVersion): TransactionAccountResolver {
    return version === 0 ? resolveV0Accounts : resolveStaticAccounts;
}
