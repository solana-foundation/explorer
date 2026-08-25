import { address, defineInstructionCard, seed } from '@entities/instruction-card';

import { AssignWithSeedInfo } from './types';

export const AssignWithSeedDetailsCard = defineInstructionCard<AssignWithSeedInfo>({
    fields: info => [
        address('Account Address', info.account),
        address('Base Address', info.base),
        seed('Seed', info.seed),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Assign Account w/ Seed',
});
