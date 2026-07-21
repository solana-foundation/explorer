import type { InstructionParser } from '@entities/instruction-parser';
// The SDK constant, not @providers/accounts/tokens — the provider module is 'use client' and would drag React into server consumers (the /mcp route).
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { parseTokenInstruction, parseTokenRpcInstruction, TOKEN_PROGRAM_LABEL, type TokenParsed } from './token-parser';

export const tokenInstructionParser: InstructionParser<TokenParsed> = {
    fromParsed: parseTokenRpcInstruction,
    fromTransaction: parseTokenInstruction,
    programId: TOKEN_PROGRAM_ID.toBase58(),
    programLabel: TOKEN_PROGRAM_LABEL,
};
