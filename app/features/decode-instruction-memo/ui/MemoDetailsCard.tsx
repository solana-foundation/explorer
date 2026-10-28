import {
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    preformatted,
} from '@entities/instruction-card';
import { wrap } from '@utils/index';

import { isMemoParsed } from '../lib/memo-parser';

const MemoCard = defineInstructionCard<string>({
    fields: memo => [preformatted('Data (UTF-8)', wrap(memo, 50))],
    title: 'Memo Program: Memo',
});

type MemoDetailsCardProps = {
    node: InstructionNode;
    /** Already normalised by the dispatcher — this card does not decode. */
    parsed: unknown;
};

export function MemoDetailsCard({ node, parsed }: MemoDetailsCardProps) {
    if (!isMemoParsed(parsed)) {
        return <InstructionCardView node={node} title="Memo Program: Unknown Instruction" />;
    }

    return <MemoCard node={node} info={parsed.info} />;
}
