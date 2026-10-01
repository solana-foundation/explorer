import type { InstructionParser } from '@entities/instruction-parser';

import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    COMPUTE_BUDGET_PROGRAM_LABEL,
    type ComputeBudgetParsed,
    parseComputeBudgetKitInstruction,
} from './compute-budget-parser';

export const computeBudgetInstructionParser: InstructionParser<ComputeBudgetParsed> = {
    // No `fromParsed` — the RPC never pre-parses this program, so only the byte path applies.
    fromTransaction: parseComputeBudgetKitInstruction,
    programId: COMPUTE_BUDGET_PROGRAM_ADDRESS,
    programLabel: COMPUTE_BUDGET_PROGRAM_LABEL,
};
