import { type InstructionLogs, pairLogsWithInstructions } from '@entities/program-logs/@x/compute-unit';

import { Logger } from '@/app/shared/lib/logger';

import { getDefaultComputeUnits } from './default-compute-units';
import type { InstructionCUData, InstructionCUInput } from './types';

/**
 * Formats transaction instructions and their corresponding logs into compute unit data
 * @param instructions - Every top-level instruction, in transaction order and unfiltered. See InstructionCUInput.
 * @param instructionLogs - Parsed instruction logs carrying CU consumption, as `parseProgramLogs`
 *   returns them — including any entry that belongs to no instruction, which this drops.
 * @returns Array of InstructionCUData mapping each instruction to its CU consumption
 */
export function formatInstructionLogs({
    instructions,
    instructionLogs,
}: {
    instructions: readonly InstructionCUInput[];
    instructionLogs: InstructionLogs[];
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

    const programIds = instructions.map(instruction => instruction.programId.toBase58());
    const pairedLogs = pairLogsWithInstructions(invocations, programIds);

    return instructions.map((instruction, index) => ({
        // An entry holds 0 when its program logged no "consumed" line, as a builtin does.
        computeUnits: pairedLogs[index]?.computeUnits || getDefaultComputeUnits(programIds[index]),
        name: instruction.name,
        programId: programIds[index],
        programName: instruction.programName,
    }));
}

/**
 * The log entries that stand for a top-level instruction, in transaction order.
 *
 * `parseProgramLogs` pushes an entry for every top-level `Program … invoke [1]`, but it also opens one
 * with no `invokedProgram` in two other cases: a log line that arrives while no invocation is in
 * progress, and a runtime error that produced no logs at all. Neither stands for an instruction, so
 * the count check above would report them as a caller bug.
 */
function toTopLevelInvocations(instructionLogs: InstructionLogs[]): InstructionLogs[] {
    return instructionLogs.filter(entry => entry.invokedProgram !== null);
}
