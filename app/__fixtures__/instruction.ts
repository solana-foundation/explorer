import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export function makeInstruction({
    data = [],
    keys = [],
    programId,
    writable = false,
}: {
    data?: Uint8Array | number[];
    keys?: PublicKey[];
    programId: PublicKey | string;
    writable?: boolean;
}): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: writable, pubkey })),
        programId: new PublicKey(programId),
    });
}
