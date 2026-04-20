import {
    type AccountMeta,
    type CompiledInstruction,
    type MessageAccountKeys,
    TransactionInstruction,
    type VersionedMessage,
} from '@solana/web3.js';
import bs58 from 'bs58';

import { Logger } from '@/app/shared/lib/logger';

// Converts a CompiledInstruction (index-based) into a TransactionInstruction
// (pubkey-based) using VersionedMessage helpers for signer/writable resolution.
// Returns undefined if any account index is out of range.
export function compiledToTransactionInstruction(
    ix: CompiledInstruction,
    accountKeys: MessageAccountKeys,
    message: VersionedMessage,
): TransactionInstruction | undefined {
    const programId = accountKeys.get(ix.programIdIndex);
    if (!programId) {
        Logger.warn('[token-batch] Program ID index out of range', {
            index: ix.programIdIndex,
            total: accountKeys.length,
        });
        return undefined;
    }

    const keys: AccountMeta[] = [];
    for (const accountIndex of ix.accounts) {
        const pubkey = accountKeys.get(accountIndex);
        if (!pubkey) {
            Logger.warn('[token-batch] Account index out of range', { index: accountIndex, total: accountKeys.length });
            return undefined;
        }
        keys.push({
            isSigner: message.isAccountSigner(accountIndex),
            isWritable: message.isAccountWritable(accountIndex),
            pubkey,
        });
    }

    return new TransactionInstruction({
        data: bs58.decode(ix.data),
        keys,
        programId,
    });
}
