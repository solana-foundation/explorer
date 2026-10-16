import {
    type AccountMeta,
    AccountRole,
    type Address,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    type ReadonlyUint8Array,
} from '@solana/kit';

export { MANGO_PROGRAM_IDS } from '../program-ids';

/** Create a kit instruction from raw data and a program address. */
export function makeInstruction(
    data: ReadonlyUint8Array,
    programAddress: Address,
    keys: Address[] = [],
): Instruction & InstructionWithAccounts<readonly AccountMeta[]> & InstructionWithData<ReadonlyUint8Array> {
    return {
        accounts: keys.map(key => ({ address: key, role: AccountRole.READONLY })),
        data,
        programAddress,
    };
}

/** Mango keys instruction data by a leading u32 LE discriminator; that's all detection reads. */
export function makeRawInstructionData(discriminator: number): Uint8Array {
    const data = new Uint8Array(4);
    new DataView(data.buffer).setUint32(0, discriminator, true);
    return data;
}
