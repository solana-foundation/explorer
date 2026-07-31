import type { InstructionParser } from '../../dispatcher.js';
// TODO(kit-native): take SYSTEM_PROGRAM_ADDRESS from @solana-program/system instead of deriving it via web3.js.
import { SystemProgram } from '@solana/web3.js';

import {
    parseSystemInstruction,
    parseSystemRpcInstruction,
    SYSTEM_PROGRAM_LABEL,
    type SystemParsed,
} from './parser.js';

export const systemInstructionParser: InstructionParser<SystemParsed> = {
    fromParsed: parseSystemRpcInstruction,
    fromTransaction: parseSystemInstruction,
    programId: SystemProgram.programId.toBase58(),
    programLabel: SYSTEM_PROGRAM_LABEL,
};
