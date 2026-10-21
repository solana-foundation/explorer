import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseRequestUnitsInstruction,
    parseSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';

import { isRpcParsedInstruction } from '../../transaction/parse.js';
import type { TransactionInstruction } from '../../transaction/types.js';

type ComputeBudgetCandidate = {
    accounts: [];
    data: Uint8Array;
    programAddress: typeof COMPUTE_BUDGET_PROGRAM_ADDRESS;
};

export function readComputeUnitLimitFromInstruction(instruction: TransactionInstruction): number | undefined {
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
    instruction: TransactionInstruction,
    parse: (type: ComputeBudgetInstruction, candidate: ComputeBudgetCandidate) => T | undefined,
): T | undefined {
    if (instruction.programAddress !== COMPUTE_BUDGET_PROGRAM_ADDRESS || isRpcParsedInstruction(instruction)) {
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
