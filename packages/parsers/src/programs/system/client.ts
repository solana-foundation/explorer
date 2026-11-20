import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import type { InstructionParser } from '../../dispatcher.js';
import { SYSTEM_PROGRAM_LABEL } from '../../program-registry.js';
import { parseSystemInstruction, parseSystemRpcInstruction, type SystemParsed } from './parser.js';

export const systemInstructionParser: InstructionParser<SystemParsed> = {
    fromParsed: parseSystemRpcInstruction,
    fromTransaction: parseSystemInstruction,
    programId: SYSTEM_PROGRAM_ADDRESS,
    programLabel: SYSTEM_PROGRAM_LABEL,
};
