import type {
    CompiledInnerInstruction,
    ParsedTransactionWithMeta,
    TransactionMessage,
    VersionedMessage,
} from '@solana/web3.js';

/**
 * Transaction message versions Explorer can render.
 *
 * web3.js stops at v0, so its `TransactionVersion` cannot describe a v1 transaction.
 */
export type TransactionVersion = 'legacy' | 0 | 1;

/**
 * Message-level resource limits carried by a v1 transaction.
 *
 * v1 moves these out of Compute Budget instructions and into the message itself. `priorityFee`
 * is a total amount in lamports, unlike v0's per-compute-unit price in micro-lamports.
 *
 * Structurally mirrors kit's `V1TransactionConfig`, which kit does not re-export as a type.
 */
export type TransactionConfig = {
    computeUnitLimit?: number;
    heapSize?: number;
    loadedAccountsDataSizeLimit?: number;
    priorityFeeLamports?: bigint;
};

/**
 * A parsed transaction in the shape the transaction detail page consumes.
 *
 * Matches web3.js `ParsedTransactionWithMeta` so existing consumers are unaffected, with the
 * version widened to cover v1 and the v1 resource limits attached.
 */
export type TransactionWithMeta = Omit<ParsedTransactionWithMeta, 'version'> & {
    version?: TransactionVersion;
    /** Present only on v1 transactions that set at least one resource limit. */
    transactionConfig?: TransactionConfig;
};

/**
 * A transaction's wire bytes and the parts of its metadata the inspector needs.
 *
 * `message` and `transaction` are the web3.js views of the bytes and are absent on v1, whose
 * message web3.js cannot represent. `messageBytes` is always present, so anything that only
 * needs the bytes — the download button — works on every version.
 */
export type RawTransaction = {
    message?: VersionedMessage;
    messageBytes: Uint8Array;
    meta?: {
        innerInstructions?: CompiledInnerInstruction[];
        postBalances: number[];
        preBalances: number[];
    };
    signatures: string[];
    transaction?: TransactionMessage;
    version: TransactionVersion;
};
