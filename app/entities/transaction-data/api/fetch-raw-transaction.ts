import {
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    createSolanaRpc,
    decodeTransactionFromRpcResponse,
    decompileTransactionMessage,
    getBase58Decoder,
    MAX_SUPPORTED_TRANSACTION_VERSION,
    signature as createSignature,
    type Transaction,
} from '@solana/kit';
import { type DecompileArgs, type Finality, PublicKey, TransactionMessage, VersionedMessage } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import type { RawTransaction, TransactionConfig } from '../model/types';

/**
 * Fetches a transaction's wire bytes and metadata for the inspector and the download button.
 *
 * `base64` encoding rather than `json` so the bytes are the ones the network holds: they are what
 * the download button writes, and the only representation a v1 transaction has here — web3.js
 * `VersionedMessage` tops out at v0, so `message` and `transaction` are populated for legacy and
 * v0 only.
 */
export async function fetchRawTransaction(
    url: string,
    signature: string,
    commitment?: Finality,
): Promise<RawTransaction | null> {
    const response = await createSolanaRpc(url)
        .getTransaction(createSignature(signature), {
            commitment,
            encoding: 'base64',
            maxSupportedTransactionVersion: MAX_SUPPORTED_TRANSACTION_VERSION,
        })
        .send();

    if (response === null) {
        // The cache providers distinguish "fetched, not found" from "not fetched yet" by null vs undefined.
        // eslint-disable-next-line unicorn/no-null
        return null;
    }

    const { compiledMessage, transaction } = decodeTransactionFromRpcResponse(response);
    // The decoded message bytes are a view over the response buffer; copy so callers own theirs.
    const messageBytes = new Uint8Array(transaction.messageBytes);
    const signatures = toBase58Signatures(transaction.signatures);
    const meta = response.meta;

    const base = {
        messageBytes,
        meta: meta
            ? {
                  innerInstructions:
                      meta.innerInstructions?.map(({ index, instructions }) => ({
                          index,
                          instructions: instructions.map(({ accounts, data, programIdIndex }) => ({
                              accounts: [...accounts],
                              data,
                              programIdIndex,
                          })),
                      })) ?? undefined,
                  postBalances: meta.postBalances.map(Number),
                  preBalances: meta.preBalances.map(Number),
              }
            : undefined,
        signatures,
    };

    if (compiledMessage.version === 1) {
        return { ...base, transactionConfig: readTransactionConfig(compiledMessage, signature), version: 1 };
    }

    return {
        ...base,
        ...decodeWithWeb3(messageBytes, meta?.loadedAddresses),
        version: compiledMessage.version,
    };
}

// The resource-limit rows are supplemental; the wire bytes still render, download, and inspect
// without them.
function readTransactionConfig(
    compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 1 },
    signature: string,
): TransactionConfig | undefined {
    try {
        const { config } = decompileTransactionMessage(compiledMessage);

        // A v1 message may set no limits at all, in which case there are no rows to render.
        return config && Object.values(config).some(value => value !== undefined) ? config : undefined;
    } catch (error) {
        Logger.error(error, { module: '[transaction-data]', signature });
        return undefined;
    }
}

/**
 * Renders a transaction's signatures in signer order.
 *
 * The map is insertion-ordered, matching the message's signer order. A signer slot that has not
 * been signed holds no bytes at all, which consumers render as missing rather than as a signature
 * that fails to verify.
 */
function toBase58Signatures(signatures: Transaction['signatures']): (string | undefined)[] {
    const base58Decoder = getBase58Decoder();

    return Object.values(signatures).map(signature => (signature ? base58Decoder.decode(signature) : undefined));
}

type RpcLoadedAddresses = Readonly<{ readonly: readonly string[]; writable: readonly string[] }>;

function decodeWithWeb3(
    messageBytes: Uint8Array,
    loadedAddresses: RpcLoadedAddresses | undefined,
): { message: VersionedMessage; transaction: TransactionMessage } {
    const message = VersionedMessage.deserialize(messageBytes);
    const accountKeysFromLookups = loadedAddresses && {
        readonly: loadedAddresses.readonly.map(address => new PublicKey(address)),
        writable: loadedAddresses.writable.map(address => new PublicKey(address)),
    };
    const decompileArgs: DecompileArgs | undefined = accountKeysFromLookups && { accountKeysFromLookups };

    return { message, transaction: TransactionMessage.decompile(message, decompileArgs) };
}
