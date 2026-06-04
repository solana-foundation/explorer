import {
    type AccountMeta as LegacyAccountMeta,
    type ParsedInstruction,
    type ParsedMessage,
    type ParsedMessageAccount,
    type ParsedTransaction,
    type PublicKey,
    type TransactionInstruction,
    type VersionedMessage,
} from '@solana/web3.js';

import type { ParsedInstructionInfo } from './types';

// Compat shims that let inspector input flow through cards designed for the
// tx-page's `ParsedTransaction` / `ParsedInstruction` prop shape. Phase 5
// deletes this file when cards consume `SliceParsed` directly.

export function toParsedInstruction(
    parsed: ParsedInstructionInfo,
    program: string,
    programId: PublicKey,
): ParsedInstruction {
    return {
        parsed: { info: parsed.info, type: parsed.type },
        program,
        programId,
    };
}

// Synthetic ParsedTransaction wrapper for cards that take a `tx: ParsedTransaction` prop.
export function toParsedTransaction(
    ix: TransactionInstruction,
    message: VersionedMessage,
    instructions: ParsedMessage['instructions'] = [],
    signatures: string[] = [],
): ParsedTransaction {
    return {
        message: {
            accountKeys: convertAccountKeysToParsedMessageAccounts(ix.keys),
            addressTableLookups: message.addressTableLookups,
            instructions,
            recentBlockhash: message.recentBlockhash,
        },
        signatures,
    };
}

function convertAccountKeysToParsedMessageAccounts(keys: LegacyAccountMeta[]): ParsedMessageAccount[] {
    return keys.map(
        (key): ParsedMessageAccount => ({
            pubkey: key.pubkey,
            signer: key.isSigner,
            source: 'lookupTable',
            writable: key.isWritable,
        }),
    );
}
