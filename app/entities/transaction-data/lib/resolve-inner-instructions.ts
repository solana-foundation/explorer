import type {
    CompiledInnerInstruction,
    MessageAccountKeys,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

import { compiledToTransactionInstruction } from './compiled-to-transaction-instruction';

/**
 * Decompiles a transaction's inner instructions, keyed by the index of the top-level
 * instruction that invoked them.
 *
 * A `Map`, because `Map.get` returns `undefined` for a top-level instruction that invoked nothing.
 * Unresolved instructions remain `undefined` in the array to preserve their indices.
 */
export function resolveInnerInstructions(
    compiledInnerInstructions: CompiledInnerInstruction[],
    accountKeys: MessageAccountKeys,
    message: VersionedMessage,
): Map<number, (TransactionInstruction | undefined)[]> {
    const byParentIndex = new Map<number, (TransactionInstruction | undefined)[]>();

    for (const inner of compiledInnerInstructions) {
        const resolved = inner.instructions.map(ix => compiledToTransactionInstruction(ix, accountKeys, message));
        const group = byParentIndex.get(inner.index);
        if (group) {
            group.push(...resolved);
        } else {
            byParentIndex.set(inner.index, resolved);
        }
    }

    return byParentIndex;
}
