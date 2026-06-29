// Bridges between @solana/web3.js v1 types and @solana/kit types.
// The explorer receives transaction data as web3.js v1 objects but
// @solana-program/* parsers expect kit-shaped instructions.

import {
    type AccountMeta,
    AccountRole,
    type Address,
    address,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
} from '@solana/kit';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';

// `data` is `Uint8Array` (mutable) rather than `ReadonlyUint8Array` because
// some downstream kit-shape parsers (e.g. lighthouse) require the mutable type.
// `@solana-program/*` parsers accept either, so this is the least-common-denominator.
export type KitInstruction = Instruction<string> &
    InstructionWithAccounts<AccountMeta[]> &
    InstructionWithData<Uint8Array>;

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

export function toLegacyPublicKey(addr: Address): PublicKey {
    return new PublicKey(addr);
}

export function toKitAddress(pubkey: PublicKey): Address {
    return address(pubkey.toBase58());
}
