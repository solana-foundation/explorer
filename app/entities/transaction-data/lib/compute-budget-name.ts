import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
} from '@solana-program/compute-budget';

import { identifyInstruction } from './identify-instruction';
import type { InstructionNameLookup } from './types';

// Wording matches the Compute Budget instruction cards, so the CU chart and the Programs section name
// the same instruction identically. Spelled out rather than derived: the enum is numeric, so its
// reverse mapping yields PascalCase, and "Set Loaded Accounts Data Size Limit" is not the card's wording.
// Total over the enum, so a package bump that adds an instruction is a compile error here rather than a
// silent "Instruction #N" on nearly every transaction — compute-budget-name.spec pins that totality.
export const COMPUTE_BUDGET_INSTRUCTION_NAMES: Record<ComputeBudgetInstruction, string> = {
    [ComputeBudgetInstruction.RequestHeapFrame]: 'Request Heap Frame',
    [ComputeBudgetInstruction.RequestUnits]: 'Request Units (Deprecated)',
    [ComputeBudgetInstruction.SetComputeUnitLimit]: 'Set Compute Unit Limit',
    [ComputeBudgetInstruction.SetComputeUnitPrice]: 'Set Compute Unit Price',
    [ComputeBudgetInstruction.SetLoadedAccountsDataSizeLimit]: 'Set Loaded Account Data Size Limit',
};

/**
 * The name of a Compute Budget instruction, or undefined for any other program and for an
 * unrecognized discriminator.
 *
 * Not derived from the IDL, though the Foundation publishes one naming all five instructions:
 * `NON_ANCHOR_PROGRAMS` holds Compute Budget out of the IDL fetch, that IDL account is absent on testnet
 * and unreachable on custom/localhost, and its wording differs — see the table above. A discriminator
 * lookup works on every cluster. Neither fetch cost nor an IDL name arriving late is a reason here; see
 * "Why not use the IDL for everything?" in the entity README.
 * @param lookup - The program, which gates the lookup, and the leading instruction bytes
 */
export function resolveComputeBudgetInstructionName(lookup: InstructionNameLookup): string | undefined {
    if (lookup.programId !== COMPUTE_BUDGET_PROGRAM_ADDRESS) return undefined;

    const index = identifyInstruction(identifyComputeBudgetInstruction, lookup);
    if (index === undefined) return undefined;

    // Widened to allow the numeric index: the map is total over the enum, so the miss case is
    // unreachable while the two agree, and a bump that breaks that fails to compile above.
    const names: Record<number, string | undefined> = COMPUTE_BUDGET_INSTRUCTION_NAMES;
    return names[index];
}
