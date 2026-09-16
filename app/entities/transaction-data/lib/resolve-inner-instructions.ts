import type {
    CompiledInnerInstruction,
    MessageAccountKeys,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';

import { compiledToTransactionInstruction } from './compiled-to-transaction-instruction';

/**
 * Decompiles a transaction's inner instructions, keyed by the index of the top-level
 * instruction that invoked them. A `Map` because most instructions invoke nothing, and
 * a record would type the misses as hits.
 *
 * Nothing forbids the source from reporting one parent index over several groups, so the
 * groups concatenate in arrival order rather than the later one replacing the earlier.
 *
 * A child that cannot be resolved stays in place as `undefined` rather than being
 * dropped, so it does not renumber the siblings after it.
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
