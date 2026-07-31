// Parses SPL Token batched instructions (discriminator 0xff). The decode core (offset math,
// co-signer recovery) is shared via @explorer/parsers; this module adapts web3.js shapes.

import {
    hasTokenBatchDiscriminator,
    isTokenBatchInstruction as isTokenBatchKitInstruction,
    parseTokenBatchInstruction,
} from '@explorer/parsers/token-batch';
import { type AccountMeta, isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { type ParsedTokenInstruction } from '@solana-program/token';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

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
    return isTokenBatchKitInstruction({ data: ix.data, programAddress: ix.programId.toBase58() });
}

export function parseBatchInstruction(ix: TransactionInstruction): ParsedBatchResult {
    if (!hasTokenBatchDiscriminator(ix.data)) {
        throw new Error('Not a batch instruction');
    }

    const instructions = parseTokenBatchInstruction(toKitInstruction(ix)).map(({ extraAccounts, parsed }) => ({
        extraSigners: extractExtraSigners(extraAccounts),
        parsed,
    }));

    return { instructions };
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
