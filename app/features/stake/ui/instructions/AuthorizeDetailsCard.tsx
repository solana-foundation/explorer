import { address, defineInstructionCard, text } from '@entities/instruction-card';

import type { AuthorizeInfo } from '../../lib/instruction-types';

export const AuthorizeDetailsCard = defineInstructionCard<AuthorizeInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Old Authority Address', info.authority),
        address('New Authority Address', info.newAuthority),
        text('Authority Type', info.authorityType),
        info.custodian && address('Lockup Custodian', info.custodian),
    ],
    title: 'Stake Program: Authorize',
});
