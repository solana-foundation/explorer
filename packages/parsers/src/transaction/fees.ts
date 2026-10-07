import { getTransactionConfig } from './config.js';
import { LAMPORTS_PER_SIGNATURE } from './constants.js';
import type { ParsedTransaction, PriorityFeeLamports } from './types.js';

/**
 * Priority fee from legacy or v0 transactions.
 * Floored at 0 for clusters whose fee per signature is below 5000.
 * Includes 5000 per precompile signature, since `signatureCount` omits those.
 */
export function derivePriorityFeeLamports({
    feeLamports,
    signatureCount,
}: {
    feeLamports: bigint;
    signatureCount: number;
}): PriorityFeeLamports {
    const priorityFee = feeLamports - LAMPORTS_PER_SIGNATURE * BigInt(signatureCount);
    return priorityFee > 0n ? priorityFee : 0n;
}

/**
 * The priority fee in lamports.
 *
 * - v1 declares the total on the message. An undeclared fee is 0, which is what the runtime charges.
 * - Legacy and v0 txs price per compute unit, so their total must be derived from the fee reported by the RPC.
 *
 * `undefined` means a legacy or v0 tx whose RPC fee is unknown.
 */
export function resolvePriorityFeeLamports(
    transaction: ParsedTransaction,
    meta: { feeLamports: bigint | undefined },
): PriorityFeeLamports | undefined {
    const declared = getTransactionConfig(transaction)?.priorityFeeLamports;
    if (transaction.version === 1) {
        return declared ?? 0n;
    }
    if (meta.feeLamports === undefined) {
        return undefined;
    }

    return derivePriorityFeeLamports({
        feeLamports: meta.feeLamports,
        signatureCount: transaction.numSignerAccounts,
    });
}
