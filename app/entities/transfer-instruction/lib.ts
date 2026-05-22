import type { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';

import { isTokenProgram } from '@/app/shared/model/token-program';

import type { SolTransferInstruction, TokenTransferInstruction } from './types';

// Walks top-level instructions in order; for each, also applies the predicate to
// inner instructions attached at that index. Same recognition logic, two layers.
export function collectTransferInstructions<T extends ParsedInstruction | PartiallyDecodedInstruction>(
    transaction: ParsedTransactionWithMeta,
    isMatch: (instr: ParsedInstruction | PartiallyDecodedInstruction) => instr is T,
): T[] {
    const innerByIndex = new Map<number, (ParsedInstruction | PartiallyDecodedInstruction)[]>();
    for (const inner of transaction.meta?.innerInstructions ?? []) {
        innerByIndex.set(inner.index, inner.instructions);
    }
    const result: T[] = [];
    transaction.transaction.message.instructions.forEach((instruction, index) => {
        if (isMatch(instruction)) result.push(instruction);
        for (const inner of innerByIndex.get(index) ?? []) {
            if (isMatch(inner)) result.push(inner);
        }
    });
    return result;
}

const TOKEN_TRANSFER_TYPES = new Set(['transfer', 'transferChecked', 'transfer2']);

const SOL_TRANSFER_TYPES = new Set(['transfer', 'transferWithSeed']);

export function isTokenTransferInstruction(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
): instruction is TokenTransferInstruction {
    return (
        isTokenProgram(instruction.programId.toBase58()) &&
        'parsed' in instruction &&
        TOKEN_TRANSFER_TYPES.has(instruction.parsed.type)
    );
}

export function isSolTransferInstruction(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
): instruction is SolTransferInstruction {
    return (
        SystemProgram.programId.equals(instruction.programId) &&
        'parsed' in instruction &&
        SOL_TRANSFER_TYPES.has(instruction.parsed.type)
    );
}
