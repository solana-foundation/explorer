import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export { MANGO_PROGRAM_IDS } from '../program-ids';

/** Create a TransactionInstruction from raw data and a program ID (base58 string or PublicKey). */
export function makeInstruction(
    data: Buffer,
    programId: PublicKey | string,
    keys: PublicKey[] = [],
): TransactionInstruction {
    return new TransactionInstruction({
        data,
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: new PublicKey(programId),
    });
}

/** Mango keys instruction data by a leading u32 LE discriminator; that's all detection reads. */
export function makeRawInstructionData(discriminator: number): Buffer {
    const data = Buffer.alloc(4);
    data.writeUInt32LE(discriminator, 0);
    return data;
}
