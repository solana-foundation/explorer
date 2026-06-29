import { InstructionCard } from '@components/instruction/InstructionCard';

import type { UpdateVoteStateInfo } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';
import { VoteStateRows } from './VoteStateRows';

export function UpdateVoteStateDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: VoteCardProps<UpdateVoteStateInfo> & { title: string }) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={title}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Vote Authority" pubkey={info.voteAuthority} />
            <VoteStateRows voteState={info.voteStateUpdate} />
            {info.hash !== undefined && <DetailHashRow label="Switch Proof Hash" hash={info.hash} />}
        </InstructionCard>
    );
}
