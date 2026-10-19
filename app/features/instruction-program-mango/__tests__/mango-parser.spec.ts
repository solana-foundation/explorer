import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { mangoInstructionParsers } from '../lib/mango-client';
import { MANGO_PROGRAM_LABEL } from '../lib/mango-parser';

const dispatcher = createInstructionParserDispatcher(mangoInstructionParsers);

describe('parseMangoInstruction', () => {
    it('should resolve a known discriminator to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([2, 0, 0, 0]))).toMatchObject({
            parsed: { info: {}, type: 'Deposit' },
            program: MANGO_PROGRAM_LABEL,
        });
    });

    it.each([
        { data: [255, 255, 0, 0], label: 'a discriminator outside the name table' },
        { data: [], label: 'an instruction without data' },
    ])('should leave $label unparsed', ({ data }) => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction(data))).toMatchObject({
            programLabel: MANGO_PROGRAM_LABEL,
            unknown: true,
        });
    });

    it.each(Object.values(MANGO_PROGRAM_IDS))('should register the %s deployment', programId => {
        expect(dispatcher.getInstructionParser(programId)?.programLabel).toBe(MANGO_PROGRAM_LABEL);
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [],
        programId: new PublicKey(MANGO_PROGRAM_IDS.mainnet),
    });
}
