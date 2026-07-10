import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { concatBytes, toBuffer, writeU64LE } from '@/app/shared/lib/bytes';

import { BATCH_DISCRIMINATOR } from '../const';

// Deterministic distinct pubkeys (was Keypair.generate(), which made story captures non-deterministic).
let accountSeq = 0;
function nextFixedPubkey() {
    const b = new Uint8Array(32);
    b[0] = 9;
    accountSeq += 1;
    b[1] = accountSeq & 0xff;
    b[2] = (accountSeq >> 8) & 0xff;
    return new PublicKey(b);
}

export function makeAccount(writable = true, signer = false) {
    return {
        isSigner: signer,
        isWritable: writable,
        pubkey: nextFixedPubkey(),
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

export function makeApproveData(amount: bigint): Uint8Array {
    return concatBytes(new Uint8Array([4]), writeU64LE(amount));
}

export function makeApproveCheckedData(amount: bigint, decimals: number): Uint8Array {
    return concatBytes(new Uint8Array([13]), writeU64LE(amount), new Uint8Array([decimals]));
}

export function makeMintToCheckedData(amount: bigint, decimals: number): Uint8Array {
    return concatBytes(new Uint8Array([14]), writeU64LE(amount), new Uint8Array([decimals]));
}

export function makeBurnData(amount: bigint): Uint8Array {
    return concatBytes(new Uint8Array([8]), writeU64LE(amount));
}

export function makeBurnCheckedData(amount: bigint, decimals: number): Uint8Array {
    return concatBytes(new Uint8Array([15]), writeU64LE(amount), new Uint8Array([decimals]));
}

// InitializeMint: [discriminator(0), decimals(u8), mintAuthority(32), option_tag(u8), ?freezeAuthority(32)]
export function makeInitializeMintData(
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority?: PublicKey,
): Uint8Array {
    if (freezeAuthority) {
        return concatBytes(
            new Uint8Array([0, decimals]),
            mintAuthority.toBytes(),
            new Uint8Array([1]),
            freezeAuthority.toBytes(),
        );
    }
    return concatBytes(new Uint8Array([0, decimals]), mintAuthority.toBytes(), new Uint8Array([0]));
}

// InitializeAccount v1: [discriminator(1)] — owner is account[2]
export function makeInitializeAccountData(): Uint8Array {
    return new Uint8Array([1]);
}

// InitializeAccount2: [discriminator(16), owner(32)]
export function makeInitializeAccount2Data(owner: PublicKey): Uint8Array {
    return concatBytes(new Uint8Array([16]), owner.toBytes());
}

// SyncNative: [discriminator(17)]
export function makeSyncNativeData(): Uint8Array {
    return new Uint8Array([17]);
}

// WithdrawExcessLamports: [discriminator(38)]
export function makeWithdrawExcessLamportsData(): Uint8Array {
    return new Uint8Array([38]);
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
