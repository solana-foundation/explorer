import type { Address } from '@solana/kit';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseRequestUnitsInstruction,
    parseSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';

/**
 * Structural, so `programs/*` never imports `transaction`.
 * An RPC-parsed instruction carries no `data`, so it reads as no limit.
 */
type InstructionInput = { programAddress: Address; data?: Uint8Array };

type ComputeBudgetCandidate = {
    accounts: [];
    data: Uint8Array;
    programAddress: typeof COMPUTE_BUDGET_PROGRAM_ADDRESS;
};

export function readComputeUnitLimitFromInstruction(instruction: InstructionInput): number | undefined {
    return readComputeBudgetInstruction(instruction, (type, candidate) => {
        if (type === ComputeBudgetInstruction.SetComputeUnitLimit) {
            return parseSetComputeUnitLimitInstruction(candidate).data.units;
        }
        // RequestUnits predates SetComputeUnitLimit, and a legacy transaction can still carry it.
        if (type === ComputeBudgetInstruction.RequestUnits) {
            return parseRequestUnitsInstruction(candidate).data.units;
        }
        return undefined;
    });
}

/** Narrows an instruction to the Compute Budget program, then identifies and parses it under one guard. */
function readComputeBudgetInstruction<T>(
    instruction: InstructionInput,
    parse: (type: ComputeBudgetInstruction, candidate: ComputeBudgetCandidate) => T | undefined,
): T | undefined {
    if (instruction.programAddress !== COMPUTE_BUDGET_PROGRAM_ADDRESS || !instruction.data) {
        return undefined;
    }

    const candidate: ComputeBudgetCandidate = {
        accounts: [],
        data: instruction.data,
        programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
    };

    try {
        return parse(identifyComputeBudgetInstruction(candidate), candidate);
    } catch {
        return undefined;
    }
}
