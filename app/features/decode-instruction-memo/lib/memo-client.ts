import type { InstructionParser } from '@entities/instruction-parser';

import {
    MEMO_PROGRAM_ADDRESS,
    MEMO_PROGRAM_LABEL,
    MEMO_V1_PROGRAM_ADDRESS,
    type MemoParsed,
    parseMemoInstruction,
    parseMemoRpcInstruction,
} from './memo-parser';

/** One entry per deployment: the dispatcher keys parsers by program id, and both Memo programs share a decoder. */
export const memoInstructionParsers: InstructionParser<MemoParsed>[] = [
    MEMO_PROGRAM_ADDRESS,
    MEMO_V1_PROGRAM_ADDRESS,
].map(programId => ({
    fromParsed: parseMemoRpcInstruction,
    fromTransaction: parseMemoInstruction,
    programId,
    programLabel: MEMO_PROGRAM_LABEL,
}));
