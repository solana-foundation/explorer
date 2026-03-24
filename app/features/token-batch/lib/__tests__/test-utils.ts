import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { toBuffer } from '@/app/shared/lib/bytes';

import { concatBytes, writeU64LE } from '../bytes';
import { BATCH_DISCRIMINATOR } from '../const';

export function makeAccount(writable = true, signer = false) {
    return {
        isSigner: signer,
        isWritable: writable,
        pubkey: Keypair.generate().publicKey,
    };
}

export function buildBatchData(subInstructions: { numAccounts: number; data: Uint8Array }[]): Uint8Array {
    const parts: Uint8Array[] = [new Uint8Array([BATCH_DISCRIMINATOR])];
    for (const sub of subInstructions) {
        if (sub.data.length > 255) throw new Error(`Sub-instruction data exceeds u8 max (${sub.data.length} bytes)`);
        parts.push(new Uint8Array([sub.numAccounts, sub.data.length]));
        parts.push(sub.data);
    }
    return concatBytes(...parts);
}

export function makeTransferData(amount: bigint): Uint8Array {
    return concatBytes(new Uint8Array([3]), writeU64LE(amount));
}

export function makeTransferCheckedData(amount: bigint, decimals: number): Uint8Array {
    return concatBytes(new Uint8Array([12]), writeU64LE(amount), new Uint8Array([decimals]));
}

// SetAuthority: [discriminator(6), authority_type(u8), option_tag(u8), ?new_authority(32)]
export function makeSetAuthorityData(authorityType: number, newAuthority?: PublicKey): Uint8Array {
    if (newAuthority) {
        return concatBytes(new Uint8Array([6, authorityType, 1]), newAuthority.toBytes());
    }
    return new Uint8Array([6, authorityType, 0]);
}

export function encodeSubIx(numAccounts: number, data: Uint8Array): Uint8Array {
    if (data.length > 255) throw new Error(`Sub-instruction data exceeds u8 max (${data.length} bytes)`);
    const out = new Uint8Array(2 + data.length);
    out[0] = numAccounts;
    out[1] = data.length;
    out.set(data, 2);
    return out;
}

export function makeBatchIx(
    subIxs: { numAccounts: number; data: Uint8Array }[],
    totalAccounts: number,
): TransactionInstruction {
    const body = concatBytes(
        new Uint8Array([BATCH_DISCRIMINATOR]),
        ...subIxs.map(s => encodeSubIx(s.numAccounts, s.data)),
    );
    const keys = Array.from({ length: totalAccounts }, (_, i) => makeAccount(i % 2 === 0, i === totalAccounts - 1));

    // toBuffer required by @solana/web3.js TransactionInstruction constructor
    return new TransactionInstruction({
        data: toBuffer(body),
        keys,
        programId: TOKEN_2022_PROGRAM_ID,
    });
}

export function makeBatchIxWithKeys(
    subIxs: { numAccounts: number; data: Uint8Array }[],
    keys: ReturnType<typeof makeAccount>[],
): TransactionInstruction {
    const body = concatBytes(
        new Uint8Array([BATCH_DISCRIMINATOR]),
        ...subIxs.map(s => encodeSubIx(s.numAccounts, s.data)),
    );

    // toBuffer required by @solana/web3.js TransactionInstruction constructor
    return new TransactionInstruction({
        data: toBuffer(body),
        keys,
        programId: TOKEN_2022_PROGRAM_ID,
    });
}
