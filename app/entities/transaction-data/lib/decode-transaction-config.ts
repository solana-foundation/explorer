import {
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    decompileTransactionMessage,
    getTransactionMessageComputeUnitLimit,
    getTransactionMessageHeapSize,
    getTransactionMessageLoadedAccountsDataSizeLimit,
    getTransactionMessagePriorityFeeLamports,
} from '@solana/kit';

import type { TransactionConfig } from '../model/types';

/**
 * Reads the message-level resource limits out of a compiled transaction message.
 *
 * v1 carries these in the message rather than in Compute Budget instructions, and the RPC's
 * `jsonParsed` encoding does not surface them, so they have to come from the wire bytes.
 *
 * Returns `undefined` when the message is not v1, or when it sets no limits at all.
 */
export function decodeTransactionConfig(
    compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
): TransactionConfig | undefined {
    if (compiledMessage.version !== 1) {
        return undefined;
    }

    const message = decompileTransactionMessage(compiledMessage);
    const config: TransactionConfig = {
        computeUnitLimit: getTransactionMessageComputeUnitLimit(message),
        heapSize: getTransactionMessageHeapSize(message),
        loadedAccountsDataSizeLimit: getTransactionMessageLoadedAccountsDataSizeLimit(message),
        priorityFeeLamports: getTransactionMessagePriorityFeeLamports(message),
    };

    return Object.values(config).every(value => value === undefined) ? undefined : config;
}
