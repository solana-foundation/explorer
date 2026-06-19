import { InstructionCard } from '@components/instruction/InstructionCard';
import { displayTimestamp } from '@utils/date';

import type { VoteInfo } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

// "vote" and "voteSwitch" — the pre-TowerSync vote instructions, deprecated on chain
// but still present in historical transactions.
export function LegacyVoteDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: VoteCardProps<VoteInfo> & { title: string }) {
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
            <DetailRow label="Slot Hashes Sysvar" pubkey={info.slotHashesSysvar} />
            <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />
            <DetailRow label="Vote Authority" pubkey={info.voteAuthority} />
            <DetailHashRow label="Vote Hash" hash={info.vote.hash} />
            {info.vote.timestamp ? (
                <DetailRow label="Timestamp" monospace>
                    {displayTimestamp(info.vote.timestamp * 1000)}
                </DetailRow>
            ) : undefined}
            <DetailRow label="Slots" monospace>
                <pre className="mb-0 inline-block text-left">{info.vote.slots.join('\n')}</pre>
            </DetailRow>
            {info.hash !== undefined && <DetailHashRow label="Switch Proof Hash" hash={info.hash} />}
        </InstructionCard>
    );
}
