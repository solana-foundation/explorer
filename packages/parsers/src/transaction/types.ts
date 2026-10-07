import type { Address } from '@solana/kit';

export type TransactionVersion = 'legacy' | 0 | 1;

/**
 * The version an RPC response reports, before the message is decoded.
 * `null` means the response has no `version` field, because the request omitted `maxSupportedTransactionVersion`.
 */
export type ReportedTransactionVersion = TransactionVersion | null;

export type AddressTableLookup = {
    accountKey: Address;
    readonlyIndexes: readonly number[];
    writableIndexes: readonly number[];
};

export type TransactionAccount = {
    address: Address;
    signer: boolean;
    writable: boolean;
    source: 'static' | 'lookupTable';
    /** The lookup table this address came from, when the encoding reports it. v0 only. */
    lookupTableAddress?: Address;
};

/** The RPC's own decode, under `jsonParsed` encoding only. The RPC sends no account list or data with it. */
export type RpcParsedInstruction = { programAddress: Address; parsed: unknown };

export type TransactionInstruction =
    | { programAddress: Address; accounts: readonly TransactionAccount[]; data: Uint8Array }
    | RpcParsedInstruction;

/** A u64 on the wire, so bigint keeps every value exact. */
export type PriorityFeeLamports = bigint;

export type TransactionConfig = {
    computeUnitLimit?: number;
    heapSize?: number;
    loadedAccountsDataSizeLimit?: number;
    /** A total, in lamports. Legacy and v0 have no equivalent: they price per compute unit. */
    priorityFeeLamports?: PriorityFeeLamports;
};

type TransactionBase = {
    accounts: readonly TransactionAccount[];
    instructions: readonly TransactionInstruction[];
    numSignerAccounts: number;
    /** Recent blockhash or durable nonce. */
    lifetimeSpecifier: string;
    signatures: readonly (string | undefined)[];
};

export type ParsedTransaction =
    | (TransactionBase & { version: 'legacy' })
    | (TransactionBase & {
          version: 0;
          /** `undefined` means the response did not report the tables. `[]` means none. */
          addressTableLookups?: readonly AddressTableLookup[];
          /** Loaded addresses missing from every listed lookup table. Absent when the encoding omits them. */
          unmatchedLookupTableAddresses?: readonly Address[];
          /** Lookup table indexes that no loaded address fills. Absent when the encoding omits the tables. */
          unmatchedLookupTableIndexes?: readonly AddressTableLookup[];
      })
    | (TransactionBase & { version: 1; config?: TransactionConfig });

/**
 * `loadedAddresses` is RPC-shaped: plain strings, because that is what every caller holds.
 * The constructors widen it to `Address` before resolution.
 * kit's own `LoadedAddresses` type is `Address[]`, so it is assignable here too.
 * A v0 message that lists lookup table slots requires it. Empty lists mean the tables loaded nothing.
 */
export type FromMessageOptions = {
    loadedAddresses?: { readonly: readonly string[]; writable: readonly string[] } | null;
    signatures?: readonly (string | undefined)[];
};

/**
 * The part of a `getTransaction` or `getBlock` response that ParsedTransaction needs.
 *
 * Declared structurally, not derived from kit's overloaded `GetTransactionApi`. That type resolves to
 * whichever overload is declared last, whatever encoding was requested.
 */
export type RpcTransactionResponse = {
    meta?: {
        loadedAddresses?: { readonly: readonly string[]; writable: readonly string[] } | null;
        // An all-optional type with no index signature rejects kit's meta, which carries many more fields.
        readonly [key: string]: unknown;
    } | null;
    transaction: RpcWireTransaction | RpcJsonTransaction | RpcJsonParsedTransaction;
    version?: ReportedTransactionVersion;
};

export type RpcTransactionConfig = {
    computeUnitLimit: number | null;
    heapSize: number | null;
    loadedAccountsDataSizeLimit: number | null;
    priorityFee: PriorityFeeLamports | null;
};

/** `encoding: 'base64' | 'base58'`. A `[data, encoding]` pair. */
export type RpcWireTransaction = readonly [string, 'base58' | 'base64'];

type RpcAddressTableLookup = {
    accountKey: string;
    readonlyIndexes: readonly number[];
    writableIndexes: readonly number[];
};

/** `encoding: 'json'`. The compiled message, with a header and instructions addressed by index. */
export type RpcJsonTransaction = {
    message: {
        accountKeys: readonly string[];
        addressTableLookups?: readonly RpcAddressTableLookup[];
        header: {
            numReadonlySignedAccounts: number;
            numReadonlyUnsignedAccounts: number;
            numRequiredSignatures: number;
        };
        instructions: readonly { accounts: readonly number[]; data: string; programIdIndex: number }[];
        recentBlockhash: string;
        transactionConfig?: RpcTransactionConfig;
    };
    signatures: readonly string[];
};

/** `encoding: 'jsonParsed'`. No header. The RPC resolved every account role and may have decoded the data. */
export type RpcJsonParsedTransaction = {
    message: {
        accountKeys: readonly {
            pubkey: string;
            signer: boolean;
            source: 'lookupTable' | 'transaction';
            writable: boolean;
        }[];
        addressTableLookups?: readonly RpcAddressTableLookup[];
        instructions: readonly (
            | { accounts: readonly string[]; data: string; programId: string }
            | { parsed: unknown; program: string; programId: string }
        )[];
        recentBlockhash: string;
        transactionConfig?: RpcTransactionConfig;
    };
    signatures: readonly string[];
};
