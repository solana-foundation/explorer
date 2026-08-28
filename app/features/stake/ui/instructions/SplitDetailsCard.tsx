import { address, defineInstructionCard, sol } from '@entities/instruction-card';

import type { SplitInfo } from '../../lib/instruction-types';

export const SplitDetailsCard = defineInstructionCard<SplitInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Authority Address', info.stakeAuthority),
        address('New Stake Address', info.newSplitAccount),
        sol('Split Amount (SOL)', info.lamports),
    ],
    title: 'Stake Program: Split Stake',
});
