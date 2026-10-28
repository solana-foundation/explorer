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

export type InstructionPosition = Pick<InstructionNode, 'index' | 'childIndex'>;

/** Numbers the position from 1, as `3` or `3.2`. */
export function positionLabel({ index, childIndex }: InstructionPosition): string {
    return childIndex === undefined ? `${index + 1}` : `${index + 1}.${childIndex + 1}`;
}

/** Takes `programId` from `ix`, so the two cannot disagree. */
export function toInstructionNode(fields: Omit<InstructionNode, 'programId'>): InstructionNode {
    return { ...fields, programId: fields.ix.programId };
}

/**
 * Callers must build this type with {@link toRawInstructionNode},
 * because a spread can set `raw` to another instruction.
 */
export type RawInstructionNode = InstructionNode & { raw: TransactionInstruction };

export function toRawInstructionNode(
    fields: Omit<InstructionNode, 'programId' | 'raw' | 'ix'> & { ix: TransactionInstruction },
): RawInstructionNode {
    return { ...fields, programId: fields.ix.programId, raw: fields.ix };
}

export function instructionDataOf(nodes: ReadonlyArray<InstructionNode | undefined>) {
    return (index: number): Uint8Array | undefined => {
        const ix = nodes[index]?.ix;
        return ix && !('parsed' in ix) ? ix.data : undefined;
    };
}
