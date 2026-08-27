import { address, defineInstructionCard } from '@entities/instruction-card';

import type { MergeInfo } from '../../lib/instruction-types';

export const MergeDetailsCard = defineInstructionCard<MergeInfo>({
    fields: info => [
        address('Stake Source', info.source),
        address('Stake Destination', info.destination),
        address('Authority Address', info.stakeAuthority),
        info.clockSysvar && address('Clock Sysvar', info.clockSysvar),
        info.stakeHistorySysvar && address('Stake History Sysvar', info.stakeHistorySysvar),
    ],
    title: 'Stake Program: Merge Stake',
});
