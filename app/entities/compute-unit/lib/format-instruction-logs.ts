import type { Cluster } from '@utils/cluster';
import type { InstructionLogs } from '@utils/program-logs';

import { Logger } from '@/app/shared/lib/logger';

import { getReservedComputeUnits } from './compute-units-schedule';
import { getDefaultComputeUnits } from './default-compute-units';
import type { InstructionCUData, InstructionCUInput } from './types';

/**
 * Formats transaction instructions and their corresponding logs into compute unit data
 * @param instructions - Every top-level instruction, in transaction order and unfiltered — row `i` is
 *   paired with the `i`th top-level invocation in the logs. See InstructionCUInput.
 * @param instructionLogs - Parsed instruction logs carrying CU consumption, as `parseProgramLogs`
 *   returns them — including any entry that belongs to no instruction, which this drops.
 * @param cluster - The cluster to use for epoch-aware lookups
 * @param epoch - The epoch to use for historical lookups
 * @returns Array of InstructionCUData mapping each instruction to its CU consumption
 */
export function formatInstructionLogs({
    instructions,
    instructionLogs,
    cluster,
    epoch,
}: {
    instructions: readonly InstructionCUInput[];
    instructionLogs: InstructionLogs[];
    cluster: Cluster;
    epoch: bigint;
}): InstructionCUData[] {
    const invocations = toTopLevelInvocations(instructionLogs);

    // More top-level invocations than instructions means the caller filtered or reordered rows, so every
    // figure past that point is attributed to the wrong instruction. Fewer is normal — a failed
    // transaction stops executing, so the trailing instructions never log.
    // No rows at all is a different failure, reported at its own source — calling it misalignment here
    // would send whoever triages it hunting a filtering bug that does not exist.
    if (instructions.length > 0 && invocations.length > instructions.length) {
        // Console only: this runs inside the callers' render-phase `useMemo`, so a Sentry capture here
        // fires again on every recompute — twice per page view once the IDL names land.
        Logger.warn('[compute-unit] more top-level invocations than instructions; CU figures would misalign', {
            instructionCount: instructions.length,
            invocationCount: invocations.length,
        });
    }

    return instructions.map((instruction, index) => {
        const programId = instruction.programId.toBase58();

        return {
            computeUnits: invocations[index]?.computeUnits ?? 0,
            defaultUnits: getDefaultComputeUnits(programId),
            name: instruction.name,
            programId,
            programName: instruction.programName,
            scheduledUnits: getReservedComputeUnits({ cluster, epoch, programId }),
        };
    });
}

/**
 * The log entries that stand for a top-level instruction, in transaction order.
 *
 * `parseProgramLogs` pushes an entry for every top-level `Program … invoke [1]`, but it also opens one
 * with no `invokedProgram` in two other cases: a log line that arrives while no invocation is in
 * progress, and a runtime error that produced no logs at all. Neither stands for an instruction, so
 * pairing them by raw index shifts every later CU figure onto the wrong instruction — and the count
 * check above would report the shift as a caller bug.
 */
function toTopLevelInvocations(instructionLogs: InstructionLogs[]): InstructionLogs[] {
    return instructionLogs.filter(entry => entry.invokedProgram !== null);
}
