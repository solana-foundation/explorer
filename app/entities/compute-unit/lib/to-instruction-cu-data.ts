import { type Invocation, pairLogsWithInstructions } from '@entities/program-logs/@x/compute-unit';

import { Logger } from '@/app/shared/lib/logger';

import { getDefaultComputeUnits } from './default-compute-units';
import type { InstructionCUData, InstructionCUInput } from './types';

/**
 * Returns the compute units of each instruction: the figure from the logs, or the fixed cost of the program.
 * @param instructions - Every top-level instruction, in transaction order and unfiltered. See InstructionCUInput.
 * @param invocations - The top-level invocations of the transaction's logs, as `parseProgramLogs` returns them
 */
export function toInstructionCUData({
    instructions,
    invocations,
}: {
    instructions: readonly InstructionCUInput[];
    invocations: readonly Invocation[];
}): InstructionCUData[] {
    // Lines that no `invoke` line precedes can belong to no instruction, so the count leaves them out.
    const invocationCount = invocations.filter(invocation => invocation.programAddress !== undefined).length;

    // More top-level invocations than instructions means the caller dropped a row, so a later row can get no CU
    // figure or another instruction's. Fewer is normal: a precompile and an instruction that did not run log nothing.
    // No rows at all is a different failure, reported at its own source — calling it misalignment here
    // would send whoever triages it hunting a filtering bug that does not exist.
    if (instructions.length > 0 && invocationCount > instructions.length) {
        // Console only: this runs inside the callers' render-phase `useMemo`, so a Sentry capture here
        // fires again on every recompute — twice per page view once the IDL names land.
        Logger.warn('[compute-unit] more top-level invocations than instructions; CU figures would misalign', {
            instructionCount: instructions.length,
            invocationCount,
        });
    }

    const programIds = instructions.map(instruction => instruction.programId.toBase58());
    const pairedInvocations = pairLogsWithInstructions(invocations, programIds);

    return instructions.map((instruction, index) => ({
        computeUnits:
            pairedInvocations[index]?.computeUnits ?? getDefaultComputeUnits(programIds[index], instruction.data),
        name: instruction.name,
        programId: programIds[index],
        programName: instruction.programName,
    }));
}
