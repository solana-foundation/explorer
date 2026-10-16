import type { InstructionParser } from '@entities/instruction-parser';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole';

import { parseWormholeInstruction, WORMHOLE_PROGRAM_LABEL, type WormholeParsed } from './wormhole-parser';

/** One parser per deployment: the dispatcher keys on a single program id. */
export const wormholeInstructionParsers: InstructionParser<WormholeParsed>[] = WORMHOLE_PROGRAM_IDS.map(programId => ({
    fromTransaction: parseWormholeInstruction,
    programId,
    programLabel: WORMHOLE_PROGRAM_LABEL,
}));
