import type { InstructionParser } from '@entities/instruction-parser';
import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';

import { MANGO_PROGRAM_LABEL, type MangoParsed, parseMangoInstruction } from './mango-parser';

/** One parser per cluster deployment: the dispatcher keys on a single program id. */
export const mangoInstructionParsers: InstructionParser<MangoParsed>[] = Object.values(MANGO_PROGRAM_IDS).map(
    programId => ({
        fromTransaction: parseMangoInstruction,
        programId,
        programLabel: MANGO_PROGRAM_LABEL,
    }),
);
