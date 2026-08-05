import { AccountRole, type AccountMeta, address as assertAddress, getBase58Encoder } from '@solana/kit';
import type { KitInstruction } from '@explorer/parsers';

import type { FallbackInstruction, FallbackInstructionAccount } from './types.js';

function toAccountMeta(account: FallbackInstructionAccount): AccountMeta {
    const role = account.signer
        ? account.writable
            ? AccountRole.WRITABLE_SIGNER
            : AccountRole.READONLY_SIGNER
        : account.writable
          ? AccountRole.WRITABLE
          : AccountRole.READONLY;
    return { address: assertAddress(account.address), role };
}

/** Rebuilds a kit-shaped instruction from the cascade's base58 form; throws on invalid addresses. */
export function toKitInstruction(instruction: FallbackInstruction): KitInstruction {
    return {
        accounts: instruction.accounts.map(toAccountMeta),
        // copies — KitInstruction requires mutable bytes for downstream parsers
        data: new Uint8Array(getBase58Encoder().encode(instruction.data)),
        programAddress: assertAddress(instruction.programId),
    };
}
