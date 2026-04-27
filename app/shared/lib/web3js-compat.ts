// Bridges between @solana/web3.js v1 types and @solana/kit types.
// The explorer receives transaction data as web3.js v1 objects but
// @solana-program/* parsers expect kit-shaped instructions.

import {
    type AccountMeta,
    AccountRole,
    address,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    type ReadonlyUint8Array,
} from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';

type KitInstruction = Instruction<string> &
    InstructionWithAccounts<AccountMeta[]> &
    InstructionWithData<ReadonlyUint8Array>;

export function toKitInstruction(ix: TransactionInstruction): KitInstruction {
    return {
        accounts: ix.keys.map(
            (key): AccountMeta => ({
                address: address(key.pubkey.toBase58()),
                role: toAccountRole(key.isSigner, key.isWritable),
            }),
        ),
        data: ix.data,
        programAddress: address(ix.programId.toBase58()),
    };
}

function toAccountRole(isSigner: boolean, isWritable: boolean): AccountRole {
    if (isSigner) return isWritable ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY_SIGNER;
    return isWritable ? AccountRole.WRITABLE : AccountRole.READONLY;
}
