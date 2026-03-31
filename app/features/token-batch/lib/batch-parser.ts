// Manual parser for SPL Token batched instructions (discriminator 0xff).
//
// Why not use @solana/spl-token or @solana-program/token?
// Neither package exposes batch instruction decoding. The batch wire format
// (a sequence of packed sub-instructions inside a single instruction's data)
// is a runtime feature of the Token / Token-2022 programs but has no
// corresponding JS decoder in any published SDK version. See also the comment
// in decode-sub-instruction.ts for per-sub-instruction decoding rationale.
//
// Wire format reference:
//   https://github.com/solana-program/token/blob/065786e/pinocchio/interface/src/instruction.rs#L552

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import type { AccountMeta, PublicKey } from '@solana/web3.js';

import { readU8 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { BATCH_DISCRIMINATOR, type TokenInstructionName, typeNameByDiscriminator } from './const';

export type ParsedBatchSubInstruction<T> = {
    index: number;
    accounts: T[];
    data: Uint8Array;
    discriminator: number | undefined;
    typeName: TokenInstructionName | 'Unknown';
};

export type ParsedSubInstruction = ParsedBatchSubInstruction<AccountMeta>;

// Uses a structural type instead of TransactionInstruction so callers don't
// need to construct a full web3.js object in tests — only programId and the
// first byte of data are inspected.
export function isTokenBatchInstruction(ix: { programId: PublicKey; data: { length: number; 0?: number } }): boolean {
    const isTokenProgram = ix.programId.equals(TOKEN_PROGRAM_ID) || ix.programId.equals(TOKEN_2022_PROGRAM_ID);
    if (!isTokenProgram) return false;

    return hasBatchDiscriminator(ix.data);
}

export function parseBatchInstruction<T>(data: Uint8Array, accounts: T[]): ParsedBatchSubInstruction<T>[] {
    if (!hasBatchDiscriminator(data)) {
        throw new Error('Not a batch instruction');
    }

    const subInstructions: ParsedBatchSubInstruction<T>[] = [];
    let offset = 1; // skip batch discriminator
    let accountOffset = 0;
    let subIndex = 0;

    while (offset < data.length) {
        if (offset + 2 > data.length) {
            throw new Error(`Truncated data: expected num_accounts and data_len at offset ${offset}`);
        }
        // Wire format packs both fields as single u8 values (see header comment link)
        const numAccounts = readU8(data, offset);
        const dataLen = readU8(data, offset + 1);
        offset += 2;

        // Read sub-instruction data
        if (offset + dataLen > data.length) {
            throw new Error(
                `Truncated data: expected ${dataLen} bytes at offset ${offset}, but only ${data.length - offset} remain`,
            );
        }
        const subData = data.slice(offset, offset + dataLen);
        offset += dataLen;

        // Slice accounts
        if (accountOffset + numAccounts > accounts.length) {
            throw new Error(`Insufficient accounts: need ${accountOffset + numAccounts}, have ${accounts.length}`);
        }
        const subAccounts = accounts.slice(accountOffset, accountOffset + numAccounts);
        accountOffset += numAccounts;

        const discriminator = subData.length > 0 ? subData[0] : undefined;
        const typeName = (discriminator !== undefined && typeNameByDiscriminator[discriminator]) || 'Unknown';

        if (typeName === 'Unknown') {
            Logger.warn('[token-batch] Unknown sub-instruction discriminator', { discriminator, index: subIndex });
        }

        subInstructions.push({
            accounts: subAccounts,
            data: subData,
            discriminator,
            index: subIndex,
            typeName,
        });

        subIndex++;
    }

    return subInstructions;
}

function hasBatchDiscriminator(data: { length: number; 0?: number }): boolean {
    return data.length >= 1 && data[0] === BATCH_DISCRIMINATOR;
}
