import {
    ParsedInstruction,
    type ParsedTransactionWithMeta,
    type PartiallyDecodedInstruction,
    PublicKey,
} from '@solana/web3.js';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';

import { isParsedInstruction } from './types';

export function extractMemoFromTransaction(transaction: ParsedTransactionWithMeta): string | undefined {
    const { transaction: tx } = transaction;
    const memoInstruction = tx.message.instructions.find(isMemoProgram);
    return memoInstruction && extractMemoFromInstruction(memoInstruction);
}

function isMemoProgram(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    const memoProgramId = new PublicKey(MEMO_PROGRAM_ADDRESS);
    return instruction.programId.equals(memoProgramId);
}

function extractMemoFromInstruction(instruction: ParsedInstruction | PartiallyDecodedInstruction): string | undefined {
    return isParsedInstruction(instruction) ? String(instruction.parsed) : undefined;
}
