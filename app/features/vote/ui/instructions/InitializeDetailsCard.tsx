import { InstructionCard } from '@components/instruction/InstructionCard';

import type { InitializeInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function InitializeDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<InitializeInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Initialize"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Rent Sysvar" pubkey={info.rentSysvar} />
            <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />
            <DetailRow label="Node" pubkey={info.node} />
            <DetailRow label="Authorized Voter" pubkey={info.authorizedVoter} />
            <DetailRow label="Authorized Withdrawer" pubkey={info.authorizedWithdrawer} />
            <DetailRow label="Commission">{`${info.commission}%`}</DetailRow>
        </InstructionCard>
    );
}
