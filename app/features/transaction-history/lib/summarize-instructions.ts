import type { InstructionSummary } from '@entities/transaction-data';

export type SummarizedInstruction = {
    instruction: InstructionSummary;
    count: number;
};

export function summarizeInstructions(instructions: readonly InstructionSummary[]): SummarizedInstruction[] {
    const groups = new Map<string, SummarizedInstruction>();
    for (const instruction of instructions) {
        const key = JSON.stringify([instruction.programName, instruction.name]);
        const existing = groups.get(key);
        if (existing) {
            existing.count += 1;
        } else {
            groups.set(key, { count: 1, instruction });
        }
    }
    return Array.from(groups.values());
}
