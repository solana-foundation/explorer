import { address, defineInstructionCard, sol } from '@entities/instruction-card';

import { TransferInfo } from './types';

export const TransferDetailsCard = defineInstructionCard<TransferInfo>({
    fields: info => [
        address('From Address', info.source),
        address('To Address', info.destination),
        sol('Transfer Amount (SOL)', info.lamports),
    ],
    title: 'System Program: Transfer',
});
