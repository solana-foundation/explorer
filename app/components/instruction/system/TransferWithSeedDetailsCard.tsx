import { address, defineInstructionCard, seed, sol } from '@entities/instruction-card';

import { TransferWithSeedInfo } from './types';

export const TransferWithSeedDetailsCard = defineInstructionCard<TransferWithSeedInfo>({
    fields: info => [
        address('From Address', info.source),
        address('Destination Address', info.destination),
        address('Base Address', info.sourceBase),
        sol('Transfer Amount (SOL)', info.lamports),
        seed('Seed', info.sourceSeed),
        address('Source Owner', info.sourceOwner),
    ],
    title: 'System Program: Transfer w/ Seed',
});
