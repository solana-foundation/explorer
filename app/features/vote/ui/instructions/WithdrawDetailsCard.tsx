import { SolBalance } from '@components/common/SolBalance';
import { InstructionCard } from '@components/instruction/InstructionCard';

import type { WithdrawInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function WithdrawDetailsCard({ ix, index, result, info, innerCards, childIndex }: VoteCardProps<WithdrawInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Withdraw"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="To Address" pubkey={info.destination} />
            <DetailRow label="Withdraw Authority" pubkey={info.withdrawAuthority} />
            <DetailRow label="Withdraw Amount (SOL)">
                <SolBalance lamports={info.lamports} />
            </DetailRow>
        </InstructionCard>
    );
}
