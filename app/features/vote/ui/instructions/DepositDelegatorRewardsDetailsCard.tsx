import { SolBalance } from '@components/common/SolBalance';
import { InstructionCard } from '@components/instruction/InstructionCard';

import type { DepositDelegatorRewardsInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function DepositDelegatorRewardsDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<DepositDelegatorRewardsInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Deposit Delegator Rewards"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Source" pubkey={info.source} />
            <DetailRow label="Deposit Amount (SOL)">
                <SolBalance lamports={info.deposit} />
            </DetailRow>
        </InstructionCard>
    );
}
