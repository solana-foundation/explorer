import { createSolanaRpc, signature as createSignature } from '@solana/kit';

import { fromBase64 } from '@/app/shared/lib/bytes';

import { adaptParsedTransaction } from '../lib/adapt-parsed-transaction';
import { decodeTransactionConfig } from '../lib/decode-transaction-config';
import { decodeWireTransaction } from '../lib/decode-wire-transaction';
import type { TransactionConfig, TransactionWithMeta } from '../model/types';
import { MAX_SUPPORTED_TRANSACTION_VERSION } from './max-supported-transaction-version';

/**
 * Fetches a transaction for the detail page.
 *
 * v1 carries its resource limits in the message rather than in Compute Budget instructions, and
 * the `jsonParsed` encoding drops them, so v1 costs a second round trip to read the wire bytes.
 * Legacy and v0 make one call.
 */
export async function fetchTransactionDetails(url: string, signature: string): Promise<TransactionWithMeta | null> {
    const rpc = createSolanaRpc(url);
    const response = await rpc
        .getTransaction(createSignature(signature), {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: MAX_SUPPORTED_TRANSACTION_VERSION,
        })
        .send();

    if (response === null) {
        // The cache providers distinguish "fetched, not found" from "not fetched yet" by null vs undefined.
        // eslint-disable-next-line unicorn/no-null
        return null;
    }

    const transactionWithMeta = adaptParsedTransaction(response);
    if (transactionWithMeta.version !== 1) {
        return transactionWithMeta;
    }

    return { ...transactionWithMeta, transactionConfig: await fetchTransactionConfig(url, signature) };
}

async function fetchTransactionConfig(url: string, signature: string): Promise<TransactionConfig | undefined> {
    const response = await createSolanaRpc(url)
        .getTransaction(createSignature(signature), {
            commitment: 'confirmed',
            encoding: 'base64',
            maxSupportedTransactionVersion: MAX_SUPPORTED_TRANSACTION_VERSION,
        })
        .send();

    if (response === null) {
        return undefined;
    }

    const [base64Transaction] = response.transaction;
    return decodeTransactionConfig(decodeWireTransaction(fromBase64(base64Transaction)).compiledMessage);
}
