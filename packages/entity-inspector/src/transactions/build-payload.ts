// Ported from the solana-mcp-official fork (feat/account-resolver); instruction entries come from
// the decode cascade so the payload builder stays a pure context→wire-shape mapping.
import type { TransactionInstructionEntry, TransactionPayloadContext, TransactionPayloadOutput } from './types.js';

export function buildTransactionPayload(
    context: TransactionPayloadContext,
    instructions: TransactionInstructionEntry[],
): TransactionPayloadOutput {
    const safeSignerCount = Math.max(0, context.numRequiredSignatures);
    const signers = context.accountKeys.slice(0, safeSignerCount);

    const base = {
        accounts: context.resolvedAccounts,
        block_time: context.blockTime,
        compute_units_consumed: context.computeUnitsConsumed,
        confirmation_status: context.confirmationStatus,
        confirmations: context.confirmations,
        fee_lamports: context.feeLamports,
        instructions,
        kind: 'transaction' as const,
        log_messages: context.logMessages,
        recent_blockhash: context.recentBlockhash,
        signature: context.signature,
        signers,
        slot: context.slot,
        transaction_version: context.version,
    };

    if (context.status === 'failed') {
        return { entity: { ...base, error: context.err, status: context.status } };
    }
    return { entity: { ...base, error: null, status: context.status } };
}
