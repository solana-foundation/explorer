import {
    getReservedComputeUnits,
    MAX_COMPUTE_UNITS,
    readComputeUnitLimitFromInstruction,
    type ScheduleCluster,
} from '../programs/compute-budget/index.js';
import type { ParsedTransaction } from './types.js';

export type RequestedComputeUnits = {
    value: number;
    /**
     * `declared`: the transaction sets the limit.
     * `calculated`: no limit is set, so the per-program reserves are summed.
     * `fallback`: a v1 transaction sets no limit, so the budget is 0.
     */
    source: 'declared' | 'fallback' | 'calculated';
};

export function getRequestedComputeUnits(
    transaction: ParsedTransaction,
    context: { cluster: ScheduleCluster; epoch: bigint | undefined },
): RequestedComputeUnits {
    if (transaction.version === 1) {
        const declared = transaction.config?.computeUnitLimit;
        return declared === undefined
            ? { source: 'fallback', value: 0 }
            : { source: 'declared', value: Math.min(declared, MAX_COMPUTE_UNITS) };
    }

    let total = 0;
    for (const instruction of transaction.instructions) {
        const declared = readComputeUnitLimitFromInstruction(instruction);
        // An explicit limit replaces the reserves entirely, exactly as the runtime treats it.
        if (declared !== undefined) {
            return { source: 'declared', value: Math.min(declared, MAX_COMPUTE_UNITS) };
        }
        total += getReservedComputeUnits({
            cluster: context.cluster,
            epoch: context.epoch,
            programAddress: instruction.programAddress,
        });
    }

    return { source: 'calculated', value: Math.min(total, MAX_COMPUTE_UNITS) };
}
