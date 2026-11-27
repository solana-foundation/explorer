import { address, defineInstructionCard, string } from '@entities/instruction-card';
import { AssignWithSeedInfo } from '@explorer/parsers/programs/system';

export const AssignWithSeedDetailsCard = defineInstructionCard<AssignWithSeedInfo>({
    fields: info => [
        address('Account Address', info.account),
        address('Base Address', info.base),
        string('Seed', info.seed),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Assign Account w/ Seed',
});
