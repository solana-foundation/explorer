import { address, bytes, defineInstructionCard, seed } from '@entities/instruction-card';

import { AllocateWithSeedInfo } from './types';

export const AllocateWithSeedDetailsCard = defineInstructionCard<AllocateWithSeedInfo>({
    fields: info => [
        address('Account Address', info.account),
        address('Base Address', info.base),
        seed('Seed', info.seed),
        bytes('Allocated Data Size', info.space),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Allocate Account w/ Seed',
});
