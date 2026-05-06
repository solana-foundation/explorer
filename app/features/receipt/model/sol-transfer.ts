import { type ParsedInstruction, type ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { validate } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { isJitoTransfer } from './jito';
import { extractMemoFromTransaction } from './memo';
import { SolTransferPayload, SystemTransferInstructionRefinedSchema } from './schemas';
import { isParsedInstruction, type ReceiptSol, type SolTransferParsed } from './types';

type SolTransferInstruction = ParsedInstruction & { parsed: SolTransferParsed };

export function createSolTransferReceipt(transaction: ParsedTransactionWithMeta): ReceiptSol | undefined {
    const instructions = getSolTransferInstructions(transaction);
    if (instructions.length === 0) return undefined;

    const primary = instructions[0];
    const raw = extractSolTransferPayload(transaction, primary);

    const [err, validated] = validate(raw, SolTransferPayload, { coerce: true });
    if (err) {
        Logger.error(err);
        return undefined;
    }

    const transfers =
        instructions.length > 1
            ? instructions.map(instr => ({
                  receiver: instr.parsed.info.destination ?? '',
                  sender: instr.parsed.info.source ?? '',
                  total: instr.parsed.info.lamports ?? 0,
              }))
            : undefined;

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
    return transaction.transaction.message.instructions.filter(
        (instruction): instruction is SolTransferInstruction =>
            isSolTransfer(instruction) && !isJitoTransfer(instruction),
    );
}

function isSolTransfer(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    if (!isParsedInstruction(instruction)) return false;
    const [err] = validate(instruction, SystemTransferInstructionRefinedSchema, { coerce: true });
    return err === undefined;
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
