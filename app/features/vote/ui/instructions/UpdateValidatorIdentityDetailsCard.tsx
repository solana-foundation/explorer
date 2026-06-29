import { InstructionCard } from '@components/instruction/InstructionCard';

import type { UpdateValidatorIdentityInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function UpdateValidatorIdentityDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<UpdateValidatorIdentityInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Update Validator Identity"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="New Validator Identity" pubkey={info.newValidatorIdentity} />
            <DetailRow label="Withdraw Authority" pubkey={info.withdrawAuthority} />
        </InstructionCard>
    );
}
