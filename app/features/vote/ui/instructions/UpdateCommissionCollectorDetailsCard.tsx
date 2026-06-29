import { InstructionCard } from '@components/instruction/InstructionCard';

import type { UpdateCommissionCollectorInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function UpdateCommissionCollectorDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<UpdateCommissionCollectorInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Update Commission Collector"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="New Collector" pubkey={info.newCollector} />
            <DetailRow label="Withdraw Authority" pubkey={info.withdrawAuthority} />
            <DetailRow label="Commission Kind">{info.commissionKind}</DetailRow>
        </InstructionCard>
    );
}
