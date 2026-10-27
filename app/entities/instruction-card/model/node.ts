import type { ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';

export type InstructionNode = {
    programId: PublicKey;
    /** The frame reads `ix`. A card must not read `ix`, so a change to the shape of `ix` touches no card. */
    ix: ParsedInstruction | TransactionInstruction;
    index: number;
    childIndex?: number;
    /** Raw form of the instruction, when the page has its bytes. */
    raw?: TransactionInstruction;
    children?: ReadonlyArray<InstructionNode | undefined>;
};

/** Takes `programId` from `ix`, so the two cannot disagree. */
export function toInstructionNode(fields: Omit<InstructionNode, 'programId'>): InstructionNode {
    return { ...fields, programId: fields.ix.programId };
}

export function instructionDataOf(nodes: ReadonlyArray<InstructionNode | undefined>) {
    return (index: number): Uint8Array | undefined => {
        const ix = nodes[index]?.ix;
        return ix && !('parsed' in ix) ? ix.data : undefined;
    };
}
