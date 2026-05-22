import {
    collectTransferInstructions,
    isSolTransferInstruction,
    type SolTransferInstruction,
} from '@entities/transfer-instruction';
import type { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { validate } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { isJitoTransfer } from './jito';
import { extractMemoFromTransaction } from './memo';
import { SolTransferPayload } from './schemas';
import { type ReceiptSol, type Transfer } from './types';

export function createSolTransferReceipt(transaction: ParsedTransactionWithMeta): ReceiptSol | undefined {
    const instructions = getSolTransferInstructions(transaction);
    if (instructions.length === 0) return undefined;

    const primary = instructions[0];
    const raw = extractSolTransferPayload(transaction, primary);

    const [err, validated] = validate(raw, SolTransferPayload, { coerce: true });
    if (err) {
        Logger.error(err, { instructionIndex: 0 });
        return undefined;
    }

    let transfers: Transfer[] | undefined;
    if (instructions.length > 1) {
        const validatedTransfers = buildTransfers(transaction, instructions);
        if (!validatedTransfers) return undefined;
        transfers = validatedTransfers;
    }

    const total = transfers ? transfers.reduce((sum, t) => sum + t.total, 0) : validated.total;

    return {
        ...validated,
        memo: raw.memo,
        total,
        transfers,
        type: 'sol',
    };
}

function getSolTransferInstructions(transaction: ParsedTransactionWithMeta): SolTransferInstruction[] {
    return collectTransferInstructions(
        transaction,
        (instr: ParsedInstruction | PartiallyDecodedInstruction): instr is SolTransferInstruction =>
            isSolTransferInstruction(instr) && !isJitoTransfer(instr),
    );
}

function buildTransfers(
    transaction: ParsedTransactionWithMeta,
    instructions: SolTransferInstruction[],
): Transfer[] | undefined {
    const result: Transfer[] = [];
    for (const [i, instr] of instructions.entries()) {
        const payload = extractSolTransferPayload(transaction, instr);
        const [err, v] = validate(payload, SolTransferPayload, { coerce: true });
        if (err) {
            Logger.error(err, { instructionIndex: i });
            return undefined;
        }
        result.push({ receiver: v.receiver, sender: v.sender, total: v.total });
    }
    return result;
}

function extractSolTransferPayload(transaction: ParsedTransactionWithMeta, instruction: SolTransferInstruction) {
    const { info } = instruction.parsed;
    return {
        date: transaction.blockTime ?? undefined,
        fee: transaction.meta?.fee,
        memo: extractMemoFromTransaction(transaction),
        receiver: info.destination,
        sender: info.source,
        total: info.lamports,
    };
}
