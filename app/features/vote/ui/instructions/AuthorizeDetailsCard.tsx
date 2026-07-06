import { InstructionCard } from '@components/instruction/InstructionCard';

import type { AuthorizeInfo } from '../../lib/instruction-types';
import { AuthorityTypeRows } from './AuthorityTypeRows';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function AuthorizeDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: VoteCardProps<AuthorizeInfo> & { title: string }) {
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
            <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />
            <DetailRow label="Old Authority" pubkey={info.authority} />
            <DetailRow label="New Authority" pubkey={info.newAuthority} />
            <AuthorityTypeRows authorityType={info.authorityType} />
        </InstructionCard>
    );
}
