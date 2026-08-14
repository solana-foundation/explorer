import { createSolanaRpc, MAX_SUPPORTED_TRANSACTION_VERSION, signature as createSignature } from '@solana/kit';
import { type DecompileArgs, type Finality, PublicKey, TransactionMessage, VersionedMessage } from '@solana/web3.js';

import { fromBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { decodeTransactionConfig } from '../lib/decode-transaction-config';
import { decodeWireTransaction, type WireTransaction } from '../lib/decode-wire-transaction';
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

    const [base64Transaction] = response.transaction;
    const { compiledMessage, messageBytes, signatures } = decodeWireTransaction(fromBase64(base64Transaction));
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
    compiledMessage: WireTransaction['compiledMessage'],
    signature: string,
): TransactionConfig | undefined {
    try {
        return decodeTransactionConfig(compiledMessage);
    } catch (error) {
        Logger.error(error, { module: '[transaction-data]', signature });
        return undefined;
    }
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
