import { address, defineInstructionCard, sol } from '@entities/instruction-card';

import type { MoveLamportsInfo, MoveStakeInfo } from '../../lib/instruction-types';

export const MoveStakeDetailsCard = defineInstructionCard<MoveStakeInfo>({
    fields: info => [
        address('Stake Source', info.source),
        address('Stake Destination', info.destination),
        address('Authority Address', info.stakeAuthority),
        sol('Move Amount (SOL)', info.lamports),
    ],
    title: 'Stake Program: Move Stake',
});

export const MoveLamportsDetailsCard = defineInstructionCard<MoveLamportsInfo>({
    fields: info => [
        address('Source', info.source),
        address('Destination', info.destination),
        address('Authority Address', info.stakeAuthority),
        sol('Move Amount (SOL)', info.lamports),
    ],
    title: 'Stake Program: Move Lamports',
});
