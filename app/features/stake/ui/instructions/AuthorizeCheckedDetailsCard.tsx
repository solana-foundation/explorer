import { address, defineInstructionCard, text } from '@entities/instruction-card';

import type { AuthorizeCheckedInfo } from '../../lib/instruction-types';

export const AuthorizeCheckedDetailsCard = defineInstructionCard<AuthorizeCheckedInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Old Authority Address', info.authority),
        address('New Authority Address', info.newAuthority),
        text('Authority Type', info.authorityType),
        address('Clock Sysvar', info.clockSysvar),
        info.custodian && address('Lockup Custodian', info.custodian),
    ],
    title: 'Stake Program: Authorize Checked',
});
