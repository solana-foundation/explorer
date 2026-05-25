import {
    collectTransferInstructions,
    isRentFundingProgram,
    isSolTransferInstruction,
    type LocatedInstruction,
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
    const located = getSolTransferInstructions(transaction);
    if (located.length === 0) return undefined;

    const primary = located[0];
    const raw = extractSolTransferPayload(transaction, primary.instruction);

    const [err, validated] = validate(raw, SolTransferPayload, { coerce: true });
    if (err) {
        Logger.error(err, { innerIndex: primary.innerIndex, topLevelIndex: primary.topLevelIndex });
        return undefined;
    }

    let transfers: Transfer[] | undefined;
    if (located.length > 1) {
        const validatedTransfers = buildTransfers(transaction, located);
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

function getSolTransferInstructions(
    transaction: ParsedTransactionWithMeta,
): LocatedInstruction<SolTransferInstruction>[] {
    const collected = collectTransferInstructions(
        transaction,
        (instr: ParsedInstruction | PartiallyDecodedInstruction): instr is SolTransferInstruction =>
            isSolTransferInstruction(instr) && !isJitoTransfer(instr),
    );
    // Drop inner System.transfers whose parent top-level instruction is a known rent-funding
    // program (e.g. ATA Create): those are bookkeeping CPIs, not user-intended payments.
    const topLevel = transaction.transaction.message.instructions;
    return collected.filter(({ innerIndex, topLevelIndex }) => {
        if (innerIndex === undefined) return true;
        return !isRentFundingProgram(topLevel[topLevelIndex].programId);
    });
}

function buildTransfers(
    transaction: ParsedTransactionWithMeta,
    located: LocatedInstruction<SolTransferInstruction>[],
): Transfer[] | undefined {
    const result: Transfer[] = [];
    for (const { instruction, innerIndex, topLevelIndex } of located) {
        const payload = extractSolTransferPayload(transaction, instruction);
        const [err, v] = validate(payload, SolTransferPayload, { coerce: true });
        if (err) {
            Logger.error(err, { innerIndex, topLevelIndex });
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
