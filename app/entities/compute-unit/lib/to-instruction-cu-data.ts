import {
    type Invocation,
    pairLogsWithInstructions,
    type ParsedProgramLogs,
} from '@entities/program-logs/@x/compute-unit';

import { Logger } from '@/app/shared/lib/logger';

import { getDefaultComputeUnits, getNonMigratingBuiltinComputeUnits, isPrecompile } from './default-compute-units';
import type { InstructionComputeUnits, InstructionCUData, InstructionCUInput, TransactionOutcome } from './types';

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
    const invocationCount = invocations.filter(invocation => invocation.programAddress !== undefined).length;

    if (instructions.length > 0 && invocationCount > instructions.length) {
        Logger.warn('[compute-unit] more top-level invocations than instructions; CU figures would misalign', {
            instructionCount: instructions.length,
            invocationCount,
        });
    }

    const programIds = instructions.map(instruction => instruction.programId.toBase58());
    const pairedInvocations = pairLogsWithInstructions(invocations, programIds);

    return instructions.map((instruction, index) => {
        const programId = instruction.programId.toBase58();

        return {
            computeUnits: toComputeUnits({
                data: instruction.data,
                execution: toExecution(index, outcome),
                invocation: pairedInvocations.at(index),
                logsTruncated: logs.truncated,
                programId,
            }),
            name: instruction.name,
            programId,
            programName: instruction.programName,
        };
    });
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

    return logsTruncated ? getNonMigratingBuiltinComputeUnits(programId) : getDefaultComputeUnits(programId, data);
}

type Execution = 'completed' | 'not-executed' | 'unknown';

function toExecution(index: number, outcome: TransactionOutcome): Execution {
    if (outcome.status === 'succeeded') return 'completed';
    if (outcome.failedInstructionIndex === undefined || index === outcome.failedInstructionIndex) return 'unknown';

    return index < outcome.failedInstructionIndex ? 'completed' : 'not-executed';
}
