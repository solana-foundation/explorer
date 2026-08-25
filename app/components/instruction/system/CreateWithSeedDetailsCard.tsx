import { address, bytes, defineInstructionCard, seed, sol } from '@entities/instruction-card';

import { CreateAccountWithSeedInfo } from './types';

export const CreateWithSeedDetailsCard = defineInstructionCard<CreateAccountWithSeedInfo>({
    fields: info => [
        address('From Address', info.source),
        address('New Address', info.newAccount),
        address('Base Address', info.base),
        seed('Seed', info.seed),
        sol('Transfer Amount (SOL)', info.lamports),
        bytes('Allocated Data Size', info.space),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Create Account w/ Seed',
});
