import { address, defineInstructionCard } from '@entities/instruction-card';

import type { DeactivateDelinquentInfo } from '../../lib/instruction-types';

export const DeactivateDelinquentDetailsCard = defineInstructionCard<DeactivateDelinquentInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Delinquent Vote Account', info.voteAccount),
        address('Reference Vote Account', info.referenceVoteAccount),
    ],
    title: 'Stake Program: Deactivate Delinquent',
});
