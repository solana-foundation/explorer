import {
    defineInstructionCard,
    InstructionCardView,
    preformatted,
    toInstructionNode,
} from '@entities/instruction-card';
import type { ParsedInstruction, TransactionInstruction } from '@solana/web3.js';
import { wrap } from '@utils/index';

import { isMemoParsed } from '../lib/memo-parser';

const MemoCard = defineInstructionCard<string>({
    fields: memo => [preformatted('Data (UTF-8)', wrap(memo, 50))],
    title: 'Memo Program: Memo',
});

type MemoDetailsCardProps = {
    /** Already normalised by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
    /** Byte form, when the caller has one, so the shell's Raw view can show accounts and data. */
    raw?: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function MemoDetailsCard({ ix, raw, index, innerCards, childIndex }: MemoDetailsCardProps) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix, raw });

    if (!isMemoParsed(ix.parsed)) {
        return <InstructionCardView node={node} title="Memo Program: Unknown Instruction" defaultRaw />;
    }

    return <MemoCard node={node} info={ix.parsed.info} />;
}
