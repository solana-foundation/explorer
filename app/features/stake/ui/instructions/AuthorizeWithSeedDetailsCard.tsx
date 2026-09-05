import { address, defineInstructionCard, type InstructionFieldList, seed, text } from '@entities/instruction-card';

import type { AuthorizeCheckedWithSeedInfo, AuthorizeWithSeedInfo } from '../../lib/instruction-types';

type Info = AuthorizeWithSeedInfo | AuthorizeCheckedWithSeedInfo;

export const AuthorizeWithSeedDetailsCard = defineInstructionCard<Info>({
    fields,
    title: 'Stake Program: Authorize With Seed',
});

export const AuthorizeCheckedWithSeedDetailsCard = defineInstructionCard<Info>({
    fields,
    title: 'Stake Program: Authorize Checked With Seed',
});

/** One field list serves both cards. The checked variant only makes the clock sysvar required. */
function fields(info: Info): InstructionFieldList {
    return [
        address('Stake Address', info.stakeAccount),
        address('Authority Base', info.authorityBase),
        address('Authority Owner', info.authorityOwner),
        seed('Authority Seed', info.authoritySeed),
        address('New Authority Address', info.newAuthorized),
        text('Authority Type', info.authorityType),
        info.clockSysvar && address('Clock Sysvar', info.clockSysvar),
        info.custodian && address('Lockup Custodian', info.custodian),
    ];
}
