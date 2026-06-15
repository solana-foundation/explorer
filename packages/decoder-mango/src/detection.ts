import { MangoInstructionLayout } from '@blockworks-foundation/mango-client';
import { type TransactionInstruction } from '@solana/web3.js';

import { mangoGroups } from './config';

export const isMangoInstruction = (instruction: TransactionInstruction) => {
    return mangoGroups.map(group => group.mangoProgramId.toBase58()).includes(instruction.programId.toBase58());
};

export const parseMangoInstructionTitle = (instruction: TransactionInstruction): string => {
    const decodedInstruction = MangoInstructionLayout.decode(instruction.data, 0);
    return Object.keys(decodedInstruction)[0];
};
