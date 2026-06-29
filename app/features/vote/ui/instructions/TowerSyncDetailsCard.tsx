import { InstructionCard } from '@components/instruction/InstructionCard';

import type { TowerSyncInfo } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';
import { VoteStateRows } from './VoteStateRows';

export function TowerSyncDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: VoteCardProps<TowerSyncInfo> & { title: string }) {
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
            <VoteStateRows voteState={info.towerSync} />
            {info.hash !== undefined && <DetailHashRow label="Switch Proof Hash" hash={info.hash} />}
        </InstructionCard>
    );
}
