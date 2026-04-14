// Parses SPL Token batched instructions (discriminator 0xff) using the SDK's
// parseBatchInstruction helper from @solana-program/token.

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { type AccountMeta, isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { parseBatchInstruction as sdkParseBatch, type ParsedTokenInstruction } from '@solana-program/token';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { BATCH_DISCRIMINATOR } from './const';
import type { LabeledAccount } from './types';

export type ParsedSubInstruction = {
    parsed: ParsedTokenInstruction<string>;
    extraSigners: LabeledAccount[];
};

export type ParsedBatchResult = {
    instructions: ParsedSubInstruction[];
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

    // The SDK maps only named accounts per instruction type. For multisig
    // instructions the on-chain account list includes extra co-signer accounts
    // beyond the named ones. We recover them from the raw account slices using
    // the numberOfAccounts field that the batch format provides.
    const allAccounts = kitIx.accounts ?? [];
    const accountOffsets = parsed.data.data.reduce<number[]>(
        (offsets, _, i) => [...offsets, offsets[i] + parsed.data.data[i].numberOfAccounts],
        [0],
    );

    const instructions = parsed.instructions.map((sub, i) => {
        const namedCount = 'accounts' in sub && sub.accounts ? Object.keys(sub.accounts).length : 0;
        const extraSigners = extractExtraSigners(
            allAccounts.slice(accountOffsets[i] + namedCount, accountOffsets[i + 1]),
        );
        return { extraSigners, parsed: sub };
    });

    return { instructions };
}

function hasBatchDiscriminator(data: { length: number; 0?: number }): boolean {
    return data.length >= 1 && data[0] === BATCH_DISCRIMINATOR;
}

// Multisig SPL Token instructions place the multisig authority in the last
// named account slot, followed by N co-signer accounts. We label them
// "Signer 1", "Signer 2", etc. to match the old behaviour.
function extractExtraSigners(signerMetas: readonly AccountMeta<string>[]): LabeledAccount[] {
    return signerMetas.map((meta, i) => ({
        isSigner: isSignerRole(meta.role),
        isWritable: isWritableRole(meta.role),
        label: `Signer ${i + 1}`,
        pubkey: new PublicKey(meta.address),
    }));
}
