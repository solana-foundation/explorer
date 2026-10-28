import type { InstructionParser } from '@entities/instruction-parser';

import { GENESIS_PROGRAM_ADDRESS } from './constants';
import { GENESIS_PROGRAM_LABEL, type GenesisParsed, parseGenesisInstruction } from './genesis-parser';

export const genesisInstructionParser: InstructionParser<GenesisParsed> = {
    fromTransaction: parseGenesisInstruction,
    programId: GENESIS_PROGRAM_ADDRESS,
    programLabel: GENESIS_PROGRAM_LABEL,
};
