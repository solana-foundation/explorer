import type { InstructionParser } from '@entities/instruction-parser';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

import {
    ASSOCIATED_TOKEN_PROGRAM_LABEL,
    type AssociatedTokenParsed,
    parseAssociatedTokenInstruction,
    parseAssociatedTokenRpcInstruction,
} from './associated-token-parser';

export const associatedTokenInstructionParser: InstructionParser<AssociatedTokenParsed> = {
    fromParsed: parseAssociatedTokenRpcInstruction,
    fromTransaction: parseAssociatedTokenInstruction,
    programId: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    programLabel: ASSOCIATED_TOKEN_PROGRAM_LABEL,
};
