import { address, defineInstructionCard } from '@entities/instruction-card';

import type { DeactivateInfo } from '../../lib/instruction-types';

export const DeactivateDetailsCard = defineInstructionCard<DeactivateInfo>({
    fields: info => [address('Stake Address', info.stakeAccount), address('Authority Address', info.stakeAuthority)],
    title: 'Stake Program: Deactivate Stake',
});
