import { getRpc } from '@entities/cluster/@x/transaction-data';
import { MAX_SUPPORTED_TRANSACTION_VERSION, signature as createSignature } from '@solana/kit';

import { adaptParsedTransaction } from '../lib/adapt-parsed-transaction';
import type { TransactionWithMeta } from '../model/types';

/**
 * Fetches a transaction for the detail page.
 *
 * The v1 resource limits are not part of this response — the `jsonParsed` encoding drops them.
 * They are read from the wire bytes {@link fetchRawTransaction} already fetches for the download
 * button and the inspector.
 *
 * The signal is optional because the page fetches this behind a cache the visitor can abandon by
 * navigating away, while a server route answering a crawler has a deadline and nobody to abandon it.
 * @param options.abortSignal - Bounds the request. Firing it rejects, like any other RPC fault
 */
export async function fetchTransactionDetails(
    url: string,
    signature: string,
    options?: { abortSignal?: AbortSignal },
): Promise<TransactionWithMeta | null> {
    const response = await getRpc(url)
        .getTransaction(createSignature(signature), {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: MAX_SUPPORTED_TRANSACTION_VERSION,
        })
        .send({ abortSignal: options?.abortSignal });

    if (response === null) {
        // The cache providers distinguish "fetched, not found" from "not fetched yet" by null vs undefined.
        // eslint-disable-next-line unicorn/no-null
        return null;
    }

    return adaptParsedTransaction(response);
}
