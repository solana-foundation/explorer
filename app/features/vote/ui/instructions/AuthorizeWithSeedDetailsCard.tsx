import { InstructionCard } from '@components/instruction/InstructionCard';

import type { AuthorizeWithSeedInfo } from '../../lib/instruction-types';
import { AuthorityTypeRows } from './AuthorityTypeRows';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function AuthorizeWithSeedDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: VoteCardProps<AuthorizeWithSeedInfo> & { title: string }) {
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
            <DetailRow label="Authority Base Key" pubkey={info.authorityBaseKey} />
            <DetailRow label="Authority Owner" pubkey={info.authorityOwner} />
            <DetailRow label="Authority Seed" monospace>
                {info.authoritySeed}
            </DetailRow>
            <DetailRow label="New Authority" pubkey={info.newAuthority} />
            <AuthorityTypeRows authorityType={info.authorityType} />
        </InstructionCard>
    );
}
