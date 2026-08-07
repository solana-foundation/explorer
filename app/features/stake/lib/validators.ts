import { BigIntFromString } from '@validators/number';
import { AddressFromString } from '@validators/pubkey';
import { enums, Infer, nullable, number, optional, type } from 'superstruct';

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
                // Deprecated field the explorer never reads (activation math uses a fixed rate).
                // Newer validators omit it from jsonParsed output, so keep it optional or the whole
                // stake account fails validation and falls back to the generic "Account" card.
                warmupCooldownRate: optional(number()),
            }),
        }),
    ),
});

export type StakeAccount = Infer<typeof StakeAccount>;
export const StakeAccount = type({
    info: StakeAccountInfo,
    type: StakeAccountType,
});

/**
 * The delegation epochs alone, validated against **kit's** jsonParsed output.
 *
 * Separate from `StakeAccount` because kit upcasts every JSON integer to bigint except an
 * allowlist (`jsonParsedAccountsConfigs` in `@solana/rpc-transformers`, which for a stake account
 * holds only `warmupCooldownRate`). That makes `lockup.epoch`, `lockup.unixTimestamp`, and
 * `creditsObserved` bigints, which `StakeAccount`'s `number()` fields reject — so a real stake
 * account would fail validation. `type()` ignores the fields absent here, and a caller that needs
 * only the epochs never reads those three.
 *
 * `stake: nullable` also rejects a nonce account, which jsonParsed likewise reports as
 * `type: 'initialized'` but with no `stake` key at all.
 */
export type StakeDelegationAccount = Infer<typeof StakeDelegationAccount>;
export const StakeDelegationAccount = type({
    info: type({
        stake: nullable(
            type({
                delegation: type({
                    activationEpoch: BigIntFromString,
                    deactivationEpoch: BigIntFromString,
                }),
            }),
        ),
    }),
    type: StakeAccountType,
});
