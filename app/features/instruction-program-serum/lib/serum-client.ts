import type { InstructionParser } from '@entities/instruction-parser';
import { SERUM_PROGRAM_IDS } from '@explorer/decoder-serum';

import { parseSerumInstruction, SERUM_PROGRAM_LABEL, type SerumParsed } from './serum-parser';

/**
 * One parser per DEX deployment: the dispatcher keys on a single program id. The deprecated
 * Serum deployments are registered too, so every DEX instruction reaches the same card.
 */
export const serumInstructionParsers: InstructionParser<SerumParsed>[] = SERUM_PROGRAM_IDS.map(programId => ({
    fromTransaction: parseSerumInstruction,
    programId,
    programLabel: SERUM_PROGRAM_LABEL,
}));
