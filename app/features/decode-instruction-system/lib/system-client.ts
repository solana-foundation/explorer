import type { InstructionParser } from '@entities/instruction-parser';
import { SystemProgram } from '@solana/web3.js';

import {
    parseSystemInstruction,
    parseSystemRpcInstruction,
    SYSTEM_PROGRAM_LABEL,
    type SystemParsed,
} from './system-parser';

export const systemInstructionParser: InstructionParser<SystemParsed> = {
    fromParsed: parseSystemRpcInstruction,
    fromTransaction: parseSystemInstruction,
    programId: SystemProgram.programId.toBase58(),
    programLabel: SYSTEM_PROGRAM_LABEL,
};
