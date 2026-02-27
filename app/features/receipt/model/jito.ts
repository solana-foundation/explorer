import { type ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';
import { validate } from 'superstruct';

import { DEFAULT_JITO_ACCOUNTS } from './const';
import { SystemTransferInstructionRefinedSchema } from './schemas';
import { isParsedInstruction } from './types';

export function isJitoTransfer(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    if (!isParsedInstruction(instruction)) return false;
    const [err, validated] = validate(instruction, SystemTransferInstructionRefinedSchema, { coerce: true });
    if (err) return false;
    const accountsSet = new Set(getJitoAccounts());
    return accountsSet.has(validated.parsed.info.destination);
}

function getJitoAccounts(): string[] {
    const raw = process.env.NEXT_PUBLIC_RECEIPT_JITO_ACCOUNTS;
    if (raw === undefined || raw === '') return DEFAULT_JITO_ACCOUNTS;
    const list = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return list.length > 0 ? list : DEFAULT_JITO_ACCOUNTS;
}
