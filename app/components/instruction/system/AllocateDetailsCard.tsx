import { address, bytes, defineInstructionCard } from '@entities/instruction-card';

import { AllocateInfo } from './types';

export const AllocateDetailsCard = defineInstructionCard<AllocateInfo>({
    fields: info => [address('Account Address', info.account), bytes('Allocated Data Size', info.space)],
    title: 'System Program: Allocate Account',
});
