import type { InstructionParser } from '@entities/instruction-parser';

import { LIGHTHOUSE_ADDRESS, LIGHTHOUSE_PROGRAM_LABEL } from './constants';
import { parseLighthouseInstruction } from './lighthouse-parser';
import type { LighthouseParsed } from './types';

export const lighthouseInstructionParser: InstructionParser<LighthouseParsed> = {
    // No `fromParsed` — the RPC never pre-parses Lighthouse, so only the byte path applies.
    fromTransaction: parseLighthouseInstruction,
    programId: LIGHTHOUSE_ADDRESS,
    programLabel: LIGHTHOUSE_PROGRAM_LABEL,
};
