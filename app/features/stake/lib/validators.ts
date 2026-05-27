import { BigIntFromString } from '@validators/number';
import { AddressFromString } from '@validators/pubkey';
import { enums, Infer, nullable, number, type } from 'superstruct';

export type StakeAccountType = Infer<typeof StakeAccountType>;
export const StakeAccountType = enums(['uninitialized', 'initialized', 'delegated', 'rewardsPool']);

export type StakeMeta = Infer<typeof StakeMeta>;
export const StakeMeta = type({
    authorized: type({
        staker: AddressFromString,
        withdrawer: AddressFromString,
    }),
    lockup: type({
        custodian: AddressFromString,
        epoch: number(),
        unixTimestamp: number(),
    }),
    rentExemptReserve: BigIntFromString,
});

export type StakeAccountInfo = Infer<typeof StakeAccountInfo>;
export const StakeAccountInfo = type({
    meta: StakeMeta,
    stake: nullable(
        type({
            creditsObserved: number(),
            delegation: type({
                activationEpoch: BigIntFromString,
                deactivationEpoch: BigIntFromString,
                stake: BigIntFromString,
                voter: AddressFromString,
                warmupCooldownRate: number(),
            }),
        }),
    ),
});

export type StakeAccount = Infer<typeof StakeAccount>;
export const StakeAccount = type({
    info: StakeAccountInfo,
    type: StakeAccountType,
});
