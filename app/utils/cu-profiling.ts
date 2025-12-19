import { Cluster } from './cluster';
import { getReservedComputeUnits } from './compute-units-schedule';
import { getDefaultComputeUnits } from './default-compute-units';
import { InstructionLogs } from './program-logs';

export type InstructionCUData = {
    programId: string;
    computeUnits: number;
    displayUnits?: number;
    reservedValue?: number;
    minValue: number;
};

const MIN_VALUE = 150;

/**
 * Formats transaction instructions and their corresponding logs into compute unit data
 * @param instructions - Array of transaction instructions with programId
 * @param instructionLogs - Array of parsed instruction logs containing CU consumption
 * @param cluster - The cluster to use for epoch-aware lookups
 * @param epoch - Optional epoch for historical lookups
 * @returns Array of InstructionCUData mapping each instruction to its CU consumption
 */
export function formatInstructionLogs({
    instructions,
    instructionLogs,
    cluster,
    epoch,
}: {
    instructions: Array<{ programId: { toBase58(): string } }>;
    instructionLogs: InstructionLogs[];
    cluster: Cluster;
    epoch: bigint;
}): InstructionCUData[] {
    const result: InstructionCUData[] = [];

    instructions.forEach((instruction, index) => {
        const programId = instruction.programId.toBase58();

        const logEntry = instructionLogs[index];
        const computeUnits = logEntry?.computeUnits ?? 0;

        const reservedValue = getDefaultComputeUnits(programId);
        const displayUnits = getReservedComputeUnits({ cluster, epoch, programId });

        const cuData: InstructionCUData = {
            ...(computeUnits === 0 ? { reservedValue } : {}),
            ...(computeUnits === 0 ? { displayUnits } : {}),
            computeUnits,
            minValue: MIN_VALUE,
            programId,
        };

        result.push(cuData);
    });

    return result;
}
