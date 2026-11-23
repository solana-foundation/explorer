import {
    type Invocation,
    pairLogsWithInstructions,
    type ParsedProgramLogs,
} from '@entities/program-logs/@x/compute-unit';

import { Logger } from '@/app/shared/lib/logger';

import { getDefaultComputeUnits, getNonMigratingBuiltinComputeUnits, isPrecompile } from './default-compute-units';
import type { InstructionComputeUnits, InstructionCUData, InstructionCUInput, TransactionOutcome } from './types';

/**
 * Returns the compute units of each instruction.
 * @param instructions - Every top-level instruction, in transaction order and unfiltered. See InstructionCUInput.
 * @param logs - The logs of the transaction, as `parseProgramLogs` returns them
 * @param outcome - Whether the transaction or the simulation failed, and at which instruction
 */
export function toInstructionCUData({
    instructions,
    logs,
    outcome,
}: {
    instructions: readonly InstructionCUInput[];
    logs: ParsedProgramLogs;
    outcome: TransactionOutcome;
}): InstructionCUData[] {
    const { invocations } = logs;
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
        computeUnits: toComputeUnits({
            data: instruction.data,
            execution: toExecution(index, outcome),
            invocation: pairedInvocations[index],
            logsTruncated: logs.truncated,
            programId: programIds[index],
        }),
        name: instruction.name,
        programId: programIds[index],
        programName: instruction.programName,
    }));
}

function toComputeUnits({
    data,
    execution,
    invocation,
    logsTruncated,
    programId,
}: {
    data: Uint8Array | undefined;
    execution: Execution;
    invocation: Invocation | undefined;
    logsTruncated: boolean;
    programId: string;
}): InstructionComputeUnits {
    if (isPrecompile(programId)) return 0;
    if (execution === 'not-executed') return 'not-executed';
    if (invocation?.computeUnits !== undefined) return invocation.computeUnits;

    const ran = invocation !== undefined || execution === 'completed';
    if (!ran) return undefined;

    // Complete logs hold the figure of every on-chain program, so a program with no figure ran as a builtin.
    // Truncated logs can drop that figure, so they show nothing about a builtin that a feature gate moved on chain.
    return logsTruncated ? getNonMigratingBuiltinComputeUnits(programId) : getDefaultComputeUnits(programId, data);
}

// The instruction that failed ran in part, and an error that names no instruction gives no position.
type Execution = 'completed' | 'not-executed' | 'unknown';

function toExecution(index: number, outcome: TransactionOutcome): Execution {
    if (outcome.status === 'succeeded') return 'completed';
    if (outcome.failedInstructionIndex === undefined || index === outcome.failedInstructionIndex) return 'unknown';

    return index < outcome.failedInstructionIndex ? 'completed' : 'not-executed';
}
