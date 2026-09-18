import type { InstructionParser } from '@entities/instruction-parser';
import { PYTH_PROGRAM_IDS, type PythParsed } from '@explorer/decoder-pyth';

import { parsePythInstruction, PYTH_PROGRAM_LABEL } from './pyth-parser';

/**
 * One parser per oracle deployment: the dispatcher keys on a single program id, and the
 * oracle has a different address on each cluster. No `fromParsed` — the RPC never pre-parses Pyth.
 */
export const pythInstructionParsers: InstructionParser<PythParsed>[] = PYTH_PROGRAM_IDS.map(programId => ({
    fromTransaction: parsePythInstruction,
    programId,
    programLabel: PYTH_PROGRAM_LABEL,
}));
