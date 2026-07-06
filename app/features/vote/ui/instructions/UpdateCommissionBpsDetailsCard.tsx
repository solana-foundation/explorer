import { InstructionCard } from '@components/instruction/InstructionCard';

import type { UpdateCommissionBpsInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function UpdateCommissionBpsDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<UpdateCommissionBpsInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Update Commission Bps"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Withdraw Authority" pubkey={info.withdrawAuthority} />
            <DetailRow label="Commission Kind">{info.commissionKind}</DetailRow>
            <DetailRow label="Commission">{`${info.commissionBps / 100}%`}</DetailRow>
        </InstructionCard>
    );
}
