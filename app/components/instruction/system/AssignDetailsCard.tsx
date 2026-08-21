import { address, defineInstructionCard } from '@entities/instruction-card';

import { AssignInfo } from './types';

export const AssignDetailsCard = defineInstructionCard<AssignInfo>({
    fields: info => [address('Account Address', info.account), address('Assigned Program Id', info.owner)],
    title: 'System Program: Assign Account',
});
