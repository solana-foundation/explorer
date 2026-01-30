import { type ParsedInstruction, PartiallyDecodedInstruction, SystemProgram } from '@solana/web3.js';

import { DEFAULT_JITO_ACCOUNTS } from './const';
import type { SolTransferParsed } from './types';

export function isJitoTransfer(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    const accountsSet = new Set(getJitoAccounts());
    return (
        SystemProgram.programId.equals(instruction.programId) &&
        'parsed' in instruction &&
        instruction.parsed.type === 'transfer' &&
        typeof (instruction.parsed as SolTransferParsed).info?.destination === 'string' &&
        accountsSet.has(instruction.parsed.info.destination)
    );
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
