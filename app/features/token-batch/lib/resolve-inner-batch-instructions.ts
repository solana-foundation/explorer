import type {
    CompiledInnerInstruction,
    MessageAccountKeys,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

import { isTokenBatchInstruction } from './batch-parser';
import { compiledToTransactionInstruction } from './compiled-to-transaction-instruction';

// Extracts token batch TransactionInstructions from compiled inner instructions,
// grouped by parent instruction index.
export function resolveInnerBatchInstructions(
    compiledInnerInstructions: CompiledInnerInstruction[],
    accountKeys: MessageAccountKeys,
    message: VersionedMessage,
): Record<number, TransactionInstruction[]> {
    const result: Record<number, TransactionInstruction[]> = {};

    for (const inner of compiledInnerInstructions) {
        const batch = inner.instructions
            .map(ix => compiledToTransactionInstruction(ix, accountKeys, message))
            .filter((ix): ix is TransactionInstruction => ix !== undefined && isTokenBatchInstruction(ix));

        if (batch.length > 0) {
            result[inner.index] = batch;
        }
    }

    return result;
}
