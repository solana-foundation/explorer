import { Epoch } from '@components/common/Epoch';
import {
    address,
    custom,
    defineInstructionCard,
    type InstructionFieldList,
    timestamp,
} from '@entities/instruction-card';

import type { SetLockupCheckedInfo, SetLockupInfo } from '../../lib/instruction-types';

type Info = SetLockupInfo | SetLockupCheckedInfo;

export const SetLockupDetailsCard = defineInstructionCard<Info>({
    fields,
    title: 'Stake Program: Set Lockup',
});

export const SetLockupCheckedDetailsCard = defineInstructionCard<Info>({
    fields,
    title: 'Stake Program: Set Lockup Checked',
});

/** Both variants carry the same payload, so one field list serves both cards. */
function fields(info: Info): InstructionFieldList {
    return [
        address('Stake Address', info.stakeAccount),
        address('Lockup Authority', info.custodian),
        info.lockup.epoch !== undefined && custom('New Lockup Expiry Epoch', <Epoch epoch={info.lockup.epoch} link />),
        info.lockup.unixTimestamp !== undefined && timestamp('New Lockup Expiry Timestamp', info.lockup.unixTimestamp),
        info.lockup.custodian && address('New Lockup Custodian', info.lockup.custodian),
    ];
}
