import { Epoch } from '@components/common/Epoch';
import { address, custom, defineInstructionCard, timestamp } from '@entities/instruction-card';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import type { InitializeInfo } from '../../lib/instruction-types';

export const InitializeDetailsCard = defineInstructionCard<InitializeInfo>({
    fields: info => [
        address('Stake Address', info.stakeAccount),
        address('Stake Authority Address', info.authorized.staker),
        address('Withdraw Authority Address', info.authorized.withdrawer),
        info.lockup.epoch > 0 && custom('Lockup Expiry Epoch', <Epoch epoch={info.lockup.epoch} link />),
        info.lockup.unixTimestamp > 0 && timestamp('Lockup Expiry Timestamp', info.lockup.unixTimestamp),
        info.lockup.custodian !== SYSTEM_PROGRAM_ADDRESS && address('Lockup Custodian Address', info.lockup.custodian),
        address('Rent Sysvar', info.rentSysvar),
    ],
    title: 'Stake Program: Initialize Stake',
});
