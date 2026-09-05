import { address, defineInstructionCard } from '@entities/instruction-card';

import type { DelegateInfo } from '../../lib/instruction-types';

export const DelegateDetailsCard = defineInstructionCard<DelegateInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Delegated Vote Address', info.voteAccount),
        address('Authority Address', info.stakeAuthority),
    ],
    title: 'Stake Program: Delegate Stake',
});
