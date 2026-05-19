import { AddressFromString } from '@validators/pubkey';
import { enums, Infer, number, optional, string, type } from 'superstruct';

export type InitializeInfo = Infer<typeof InitializeInfo>;
export const InitializeInfo = type({
    authorized: type({
        staker: AddressFromString,
        withdrawer: AddressFromString,
    }),
    lockup: type({
        custodian: AddressFromString,
        epoch: number(),
        unixTimestamp: number(),
    }),
    stakeAccount: AddressFromString,
});

export type DelegateInfo = Infer<typeof DelegateInfo>;
export const DelegateInfo = type({
    stakeAccount: AddressFromString,
    stakeAuthority: AddressFromString,
    voteAccount: AddressFromString,
});

export type AuthorizeInfo = Infer<typeof AuthorizeInfo>;
export const AuthorizeInfo = type({
    authority: AddressFromString,
    authorityType: enums(['Staker', 'Withdrawer']),
    newAuthority: AddressFromString,
    stakeAccount: AddressFromString,
});

export type SplitInfo = Infer<typeof SplitInfo>;
export const SplitInfo = type({
    lamports: number(),
    newSplitAccount: AddressFromString,
    stakeAccount: AddressFromString,
    stakeAuthority: AddressFromString,
});

export type WithdrawInfo = Infer<typeof WithdrawInfo>;
export const WithdrawInfo = type({
    destination: AddressFromString,
    lamports: number(),
    stakeAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type DeactivateInfo = Infer<typeof DeactivateInfo>;
export const DeactivateInfo = type({
    stakeAccount: AddressFromString,
    stakeAuthority: AddressFromString,
});

// SIMD-0490 makes sysvar account inputs optional — accept Merge with or without them.
export type MergeInfo = Infer<typeof MergeInfo>;
export const MergeInfo = type({
    clockSysvar: optional(AddressFromString),
    destination: AddressFromString,
    source: AddressFromString,
    stakeAuthority: AddressFromString,
    stakeHistorySysvar: optional(AddressFromString),
});

const SetLockupArgs = type({
    custodian: optional(AddressFromString),
    epoch: optional(number()),
    unixTimestamp: optional(number()),
});

export type SetLockupInfo = Infer<typeof SetLockupInfo>;
export const SetLockupInfo = type({
    custodian: AddressFromString,
    lockup: SetLockupArgs,
    stakeAccount: AddressFromString,
});

export type SetLockupCheckedInfo = Infer<typeof SetLockupCheckedInfo>;
export const SetLockupCheckedInfo = type({
    custodian: AddressFromString,
    lockup: SetLockupArgs,
    stakeAccount: AddressFromString,
});

export type AuthorizeWithSeedInfo = Infer<typeof AuthorizeWithSeedInfo>;
export const AuthorizeWithSeedInfo = type({
    authorityBase: AddressFromString,
    authorityOwner: AddressFromString,
    authoritySeed: string(),
    authorityType: enums(['Staker', 'Withdrawer']),
    clockSysvar: optional(AddressFromString),
    custodian: optional(AddressFromString),
    newAuthorized: AddressFromString,
    stakeAccount: AddressFromString,
});

export type InitializeCheckedInfo = Infer<typeof InitializeCheckedInfo>;
export const InitializeCheckedInfo = type({
    rentSysvar: AddressFromString,
    stakeAccount: AddressFromString,
    staker: AddressFromString,
    withdrawer: AddressFromString,
});

export type AuthorizeCheckedInfo = Infer<typeof AuthorizeCheckedInfo>;
export const AuthorizeCheckedInfo = type({
    authority: AddressFromString,
    authorityType: enums(['Staker', 'Withdrawer']),
    clockSysvar: AddressFromString,
    custodian: optional(AddressFromString),
    newAuthority: AddressFromString,
    stakeAccount: AddressFromString,
});

export type AuthorizeCheckedWithSeedInfo = Infer<typeof AuthorizeCheckedWithSeedInfo>;
export const AuthorizeCheckedWithSeedInfo = type({
    authorityBase: AddressFromString,
    authorityOwner: AddressFromString,
    authoritySeed: string(),
    authorityType: enums(['Staker', 'Withdrawer']),
    clockSysvar: AddressFromString,
    custodian: optional(AddressFromString),
    newAuthorized: AddressFromString,
    stakeAccount: AddressFromString,
});

export type MoveStakeInfo = Infer<typeof MoveStakeInfo>;
export const MoveStakeInfo = type({
    destination: AddressFromString,
    lamports: number(),
    source: AddressFromString,
    stakeAuthority: AddressFromString,
});

export type MoveLamportsInfo = Infer<typeof MoveLamportsInfo>;
export const MoveLamportsInfo = type({
    destination: AddressFromString,
    lamports: number(),
    source: AddressFromString,
    stakeAuthority: AddressFromString,
});

export type DeactivateDelinquentInfo = Infer<typeof DeactivateDelinquentInfo>;
export const DeactivateDelinquentInfo = type({
    referenceVoteAccount: AddressFromString,
    stakeAccount: AddressFromString,
    voteAccount: AddressFromString,
});

export type StakeInstructionType = Infer<typeof StakeInstructionType>;
export const StakeInstructionType = enums([
    'initialize',
    'delegate',
    'authorize',
    'split',
    'withdraw',
    'deactivate',
    'merge',
    'setLockup',
    'authorizeWithSeed',
    'initializeChecked',
    'authorizeChecked',
    'authorizeCheckedWithSeed',
    'setLockupChecked',
    'moveStake',
    'moveLamports',
    'deactivateDelinquent',
    'getMinimumDelegation',
]);
