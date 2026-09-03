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
 */
export async function fetchTransactionDetails(url: string, signature: string): Promise<TransactionWithMeta | null> {
    const response = await getRpc(url)
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

    return adaptParsedTransaction(response);
}
