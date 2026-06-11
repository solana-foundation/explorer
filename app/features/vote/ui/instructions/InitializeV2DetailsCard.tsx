import { InstructionCard } from '@components/instruction/InstructionCard';

import type { InitializeV2Info } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function InitializeV2DetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<InitializeV2Info>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Initialize V2"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Node" pubkey={info.node} />
            <DetailRow label="Inflation Rewards Collector" pubkey={info.inflationRewardsCollector} />
            <DetailRow label="Block Revenue Collector" pubkey={info.blockRevenueCollector} />
            <DetailRow label="Authorized Voter" pubkey={info.authorizedVoter} />
            <DetailHashRow label="Authorized Voter BLS Pubkey" hash={info.authorizedVoterBlsPubkey} />
            <DetailHashRow
                label="Authorized Voter BLS Proof of Possession"
                hash={info.authorizedVoterBlsProofOfPossession}
            />
            <DetailRow label="Authorized Withdrawer" pubkey={info.authorizedWithdrawer} />
            <DetailRow label="Inflation Rewards Commission">{`${info.inflationRewardsCommissionBps / 100}%`}</DetailRow>
            <DetailRow label="Block Revenue Commission">{`${info.blockRevenueCommissionBps / 100}%`}</DetailRow>
        </InstructionCard>
    );
}
