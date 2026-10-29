import { type InstructionNode, toInstructionNode } from '@entities/instruction-card';
import type {
    ParsedInnerInstruction,
    ParsedInstruction,
    ParsedTransaction,
    PartiallyDecodedInstruction,
    TransactionInstruction,
} from '@solana/web3.js';
import { intoTransactionInstruction } from '@utils/tx';

export function toInstructionNodes(
    tx: ParsedTransaction,
    innerInstructions: ParsedInnerInstruction[] | undefined,
): (InstructionNode | undefined)[] {
    const cpisByIndex = new Map<number, (ParsedInstruction | PartiallyDecodedInstruction)[]>();
    for (const { index, instructions } of innerInstructions ?? []) {
        cpisByIndex.set(index, [...(cpisByIndex.get(index) ?? []), ...instructions]);
    }

    return tx.message.instructions.map((instruction, index) => {
        const ix = nodeInstruction(tx, instruction);
        const children = cpisByIndex.get(index)?.map((cpi, childIndex) => {
            const cpiIx = nodeInstruction(tx, cpi);
            return cpiIx && toInstructionNode({ childIndex, index, ix: cpiIx });
        });
        return ix && toInstructionNode({ children, index, ix });
    });
}

function nodeInstruction(
    tx: ParsedTransaction,
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
): ParsedInstruction | TransactionInstruction | undefined {
    return 'parsed' in instruction ? instruction : intoTransactionInstruction(tx, instruction);
}
