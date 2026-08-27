import { address, defineInstructionCard } from '@entities/instruction-card';

import type { InitializeCheckedInfo } from '../../lib/instruction-types';

export const InitializeCheckedDetailsCard = defineInstructionCard<InitializeCheckedInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Stake Authority Address', info.staker),
        address('Withdraw Authority Address', info.withdrawer),
        address('Rent Sysvar', info.rentSysvar),
    ],
    title: 'Stake Program: Initialize Checked',
});
