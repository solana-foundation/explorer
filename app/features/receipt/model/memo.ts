import type { TransactionWithMeta } from '@entities/transaction-data';
import { ParsedInstruction, type PartiallyDecodedInstruction } from '@solana/web3.js';
import { SUPPORTED_MEMO_PROGRAM_ADDRESSES } from '@solana-program/memo';

import { isParsedInstruction } from './types';

export function extractMemoFromTransaction(transaction: TransactionWithMeta): string | undefined {
    const { transaction: tx } = transaction;
    const memoInstruction = tx.message.instructions.find(isMemoProgram);
    return memoInstruction && extractMemoFromInstruction(memoInstruction);
}

const MEMO_PROGRAM_IDS: ReadonlySet<string> = new Set(SUPPORTED_MEMO_PROGRAM_ADDRESSES);

function isMemoProgram(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    return MEMO_PROGRAM_IDS.has(instruction.programId.toBase58());
}

function extractMemoFromInstruction(instruction: ParsedInstruction | PartiallyDecodedInstruction): string | undefined {
    return isParsedInstruction(instruction) ? String(instruction.parsed) : undefined;
}
