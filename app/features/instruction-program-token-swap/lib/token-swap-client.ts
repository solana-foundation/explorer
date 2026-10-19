import type { InstructionParser } from '@entities/instruction-parser';
import { TOKEN_SWAP_PROGRAM_IDS } from '@explorer/decoder-token-swap';

import { parseTokenSwapInstruction, TOKEN_SWAP_PROGRAM_LABEL, type TokenSwapParsed } from './token-swap-parser';

/** One parser per deployment: the dispatcher keys on a single program id. */
export const tokenSwapInstructionParsers: InstructionParser<TokenSwapParsed>[] = TOKEN_SWAP_PROGRAM_IDS.map(
    programId => ({
        fromTransaction: parseTokenSwapInstruction,
        programId,
        programLabel: TOKEN_SWAP_PROGRAM_LABEL,
    }),
);
