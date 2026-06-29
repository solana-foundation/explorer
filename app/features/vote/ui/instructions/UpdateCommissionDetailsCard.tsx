import { InstructionCard } from '@components/instruction/InstructionCard';

import type { UpdateCommissionInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function UpdateCommissionDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<UpdateCommissionInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Update Commission"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Withdraw Authority" pubkey={info.withdrawAuthority} />
            <DetailRow label="Commission">{`${info.commission}%`}</DetailRow>
        </InstructionCard>
    );
}
