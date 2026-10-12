import type { InstructionParser } from '@entities/instruction-parser';

import {
    MEMO_PROGRAM_LABEL,
    type MemoParsed,
    parseMemoInstruction,
    parseMemoRpcInstruction,
    SUPPORTED_MEMO_PROGRAM_ADDRESSES,
} from './memo-parser';

/** One entry per deployment: the dispatcher keys parsers by program id, and every Memo program shares a decoder. */
export const memoInstructionParsers: InstructionParser<MemoParsed>[] = SUPPORTED_MEMO_PROGRAM_ADDRESSES.map(
    programId => ({
        fromParsed: parseMemoRpcInstruction,
        fromTransaction: parseMemoInstruction,
        programId,
        programLabel: MEMO_PROGRAM_LABEL,
    }),
);
