import { address, defineInstructionCard, sol } from '@entities/instruction-card';

import type { WithdrawInfo } from '../../lib/instruction-types';

export const WithdrawDetailsCard = defineInstructionCard<WithdrawInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Authority Address', info.withdrawAuthority),
        address('To Address', info.destination),
        sol('Withdraw Amount (SOL)', info.lamports),
        info.custodian && address('Lockup Custodian', info.custodian),
    ],
    title: 'Stake Program: Withdraw Stake',
});
