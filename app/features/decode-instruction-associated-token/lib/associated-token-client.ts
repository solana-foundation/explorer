import type { InstructionParser } from '@entities/instruction-parser';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

import {
    ASSOCIATED_TOKEN_PROGRAM_LABEL,
    type AssociatedTokenParsed,
    parseAssociatedTokenInstruction,
    parseAssociatedTokenRpcInstruction,
} from './associated-token-parser';

export const associatedTokenInstructionParser: InstructionParser<AssociatedTokenParsed> = {
    fromParsed: parseAssociatedTokenRpcInstruction,
    fromTransaction: parseAssociatedTokenInstruction,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
    programLabel: ASSOCIATED_TOKEN_PROGRAM_LABEL,
};
