import { address, defineInstructionCard, sol } from '@entities/instruction-card';

import { WithdrawNonceInfo } from './types';

export const NonceWithdrawDetailsCard = defineInstructionCard<WithdrawNonceInfo>({
    fields: info => [
        address('Nonce Address', info.nonceAccount),
        address('Authority Address', info.nonceAuthority),
        address('To Address', info.destination),
        sol('Withdraw Amount (SOL)', info.lamports),
    ],
    title: 'System Program: Withdraw Nonce',
});
