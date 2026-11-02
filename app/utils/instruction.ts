import { IX_TITLES, TokenInstructionType } from '@components/instruction/token/types';
import { type TransactionWithMeta } from '@entities/transaction-data';
import { ConfirmedSignatureInfo, ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

export type InstructionType = {
    name: string;
    innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
};

export interface InstructionItem {
    instruction: ParsedInstruction | PartiallyDecodedInstruction;
    inner: (ParsedInstruction | PartiallyDecodedInstruction)[];
}

export class InstructionContainer {
    readonly instructions: InstructionItem[];

    static create(transactionWithMeta: TransactionWithMeta) {
        return new InstructionContainer(transactionWithMeta);
    }

    constructor(transactionWithMeta: TransactionWithMeta) {
        this.instructions = transactionWithMeta.transaction.message.instructions.map(instruction => {
            if ('parsed' in instruction) {
                if (typeof instruction.parsed === 'object') {
                    instruction.parsed = create(instruction.parsed, ParsedInfo);
                } else if (typeof instruction.parsed !== 'string') {
                    throw new Error('Unexpected parsed response');
                }
            }

            return {
                inner: [],
                instruction,
            };
        });

        if (transactionWithMeta.meta?.innerInstructions) {
            for (const inner of transactionWithMeta.meta.innerInstructions) {
                this.instructions[inner.index].inner.push(...inner.instructions);
            }
        }
    }
}

export function getTokenProgramInstructionName(ix: ParsedInstruction, signatureInfo: ConfirmedSignatureInfo): string {
    try {
        const parsed = create(ix.parsed, ParsedInfo);
        const { type: rawType } = parsed;
        const type = create(rawType, TokenInstructionType);
        return IX_TITLES[type];
    } catch (err) {
        Logger.error(err, { signature: signatureInfo.signature });
        return 'Unknown';
    }
}
