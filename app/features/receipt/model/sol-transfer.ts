import { type ParsedInstruction, type ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { validate } from 'superstruct';

import { isJitoTransfer } from './jito';
import { extractMemoFromTransaction } from './memo';
import { SolTransferPayload, SystemTransferInstructionRefinedSchema } from './schemas';
import { isParsedInstruction, type ReceiptSol, type SolTransferParsed } from './types';

type SolTransferInstruction = ParsedInstruction & { parsed: SolTransferParsed };

export function createSolTransferReceipt(transaction: ParsedTransactionWithMeta): ReceiptSol | undefined {
    const instruction = getSingleSolTransferInstruction(transaction);
    if (!instruction) return undefined;

    const raw = extractSolTransferPayload(transaction, instruction);

    const [err, validated] = validate(raw, SolTransferPayload, { coerce: true });
    if (err) {
        console.error('Error validating sol transfer payload', err);
        return undefined;
    }

    return {
        ...validated,
        memo: raw.memo,
        type: 'sol',
    };
}

// We support only single sol transfer instruction per transaction by design.
function getSingleSolTransferInstruction(transaction: ParsedTransactionWithMeta): SolTransferInstruction | undefined {
    const instructions = transaction.transaction.message.instructions
        .filter((instruction): instruction is SolTransferInstruction => isSolTransfer(instruction))
        .filter(instruction => !isJitoTransfer(instruction));
    return instructions.length === 1 ? instructions[0] : undefined;
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
