import {
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    preformatted,
} from '@entities/instruction-card';
import type { ParsedInstruction } from '@solana/web3.js';
import { wrap } from '@utils/index';

import { isMemoParsed } from '../lib/memo-parser';

const MemoCard = defineInstructionCard<string>({
    fields: memo => [preformatted('Data (UTF-8)', wrap(memo, 50))],
    title: 'Memo Program: Memo',
});

type MemoDetailsCardProps = {
    node: InstructionNode;
    /** Already normalised by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
};

export function MemoDetailsCard({ node, ix }: MemoDetailsCardProps) {
    if (!isMemoParsed(ix.parsed)) {
        return <InstructionCardView node={node} title="Memo Program: Unknown Instruction" defaultRaw />;
    }

    return <MemoCard node={node} info={ix.parsed.info} />;
}
