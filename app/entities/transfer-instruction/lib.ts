import type { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';

import { isTokenProgram } from '@/app/shared/model/token-program';

import type { SolTransferInstruction, TokenTransferInstruction } from './types';

export type LocatedInstruction<T> = {
    instruction: T;
    // Position of the parent instruction in `transaction.transaction.message.instructions`.
    topLevelIndex: number;
    // Position within the parent's inner-instructions group. Undefined when the match
    // is the top-level instruction itself.
    innerIndex?: number;
};

// Walks top-level instructions in order; for each, also applies the predicate to
// inner instructions attached at that index. Same recognition logic, two layers.
// Each match carries `topLevelIndex` (and `innerIndex` if the match came from an
// inner instruction) so downstream loggers can pinpoint the original tx position.
export function collectTransferInstructions<T extends ParsedInstruction | PartiallyDecodedInstruction>(
    transaction: ParsedTransactionWithMeta,
    isMatch: (instr: ParsedInstruction | PartiallyDecodedInstruction) => instr is T,
): LocatedInstruction<T>[] {
    const innerByIndex = new Map<number, (ParsedInstruction | PartiallyDecodedInstruction)[]>();
    for (const inner of transaction.meta?.innerInstructions ?? []) {
        innerByIndex.set(inner.index, inner.instructions);
    }
    const result: LocatedInstruction<T>[] = [];
    transaction.transaction.message.instructions.forEach((instruction, topLevelIndex) => {
        if (isMatch(instruction)) result.push({ instruction, topLevelIndex });
        const inners = innerByIndex.get(topLevelIndex) ?? [];
        inners.forEach((inner, innerIndex) => {
            if (isMatch(inner)) result.push({ instruction: inner, innerIndex, topLevelIndex });
        });
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
