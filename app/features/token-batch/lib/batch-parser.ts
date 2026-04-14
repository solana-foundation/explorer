// Parses SPL Token batched instructions (discriminator 0xff) using the SDK's
// parseBatchInstruction helper from @solana-program/token.

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { ParsedTokenInstruction } from '@solana-program/token';
import { parseBatchInstruction as sdkParseBatch } from '@solana-program/token';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { BATCH_DISCRIMINATOR } from './const';

export type ParsedBatchResult = {
    instructions: ParsedTokenInstruction<string>[];
};

// Uses a structural type instead of TransactionInstruction so callers don't
// need to construct a full web3.js object in tests — only programId and the
// first byte of data are inspected.
export function isTokenBatchInstruction(ix: {
    programId: PublicKey;
    data: { length: number; 0?: number };
    keys?: unknown[];
}): boolean {
    const isTokenProgram = ix.programId.equals(TOKEN_PROGRAM_ID) || ix.programId.equals(TOKEN_2022_PROGRAM_ID);
    if (!isTokenProgram) return false;

    return hasBatchDiscriminator(ix.data);
}

export function parseBatchInstruction(ix: TransactionInstruction): ParsedBatchResult {
    if (!hasBatchDiscriminator(ix.data)) {
        throw new Error('Not a batch instruction');
    }

    const kitIx = toKitInstruction(ix);
    const parsed = sdkParseBatch(kitIx);
    return { instructions: parsed.instructions };
}

function hasBatchDiscriminator(data: { length: number; 0?: number }): boolean {
    return data.length >= 1 && data[0] === BATCH_DISCRIMINATOR;
}
