import { makeInstruction } from '@__fixtures__/instruction';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { describe, expect, it } from 'vitest';

import { mangoInstructionParsers } from '../lib/mango-client';
import { MANGO_PROGRAM_LABEL } from '../lib/mango-parser';

const dispatcher = createInstructionParserDispatcher(mangoInstructionParsers);
const makeIx = (data: number[]) => makeInstruction({ data, programId: MANGO_PROGRAM_IDS.mainnet });

describe('parseMangoInstruction', () => {
    it('should resolve a known discriminator to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeIx([2, 0, 0, 0]))).toMatchObject({
            parsed: { info: {}, type: 'Deposit' },
            program: MANGO_PROGRAM_LABEL,
        });
    });

    it.each([
        { data: [255, 255, 0, 0], label: 'a discriminator outside the name table' },
        { data: [], label: 'an instruction without data' },
    ])('should leave $label unparsed', ({ data }) => {
        expect(dispatcher.fromTransactionInstruction(makeIx(data))).toMatchObject({
            programLabel: MANGO_PROGRAM_LABEL,
            unknown: true,
        });
    });

    it.each(Object.values(MANGO_PROGRAM_IDS))('should register the %s deployment', programId => {
        expect(dispatcher.getInstructionParser(programId)?.programLabel).toBe(MANGO_PROGRAM_LABEL);
    });
});
