import { PublicKeyFromString } from '@validators/pubkey';
import { enums, Infer, number, optional, string, type } from 'superstruct';

export type InitializeInfo = Infer<typeof InitializeInfo>;
export const InitializeInfo = type({
    authorized: type({
        staker: PublicKeyFromString,
        withdrawer: PublicKeyFromString,
    }),
    lockup: type({
        custodian: PublicKeyFromString,
        epoch: number(),
        unixTimestamp: number(),
    }),
    stakeAccount: PublicKeyFromString,
});

export type DelegateInfo = Infer<typeof DelegateInfo>;
export const DelegateInfo = type({
    stakeAccount: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
    voteAccount: PublicKeyFromString,
});

export type AuthorizeInfo = Infer<typeof AuthorizeInfo>;
export const AuthorizeInfo = type({
    authority: PublicKeyFromString,
    authorityType: string(),
    newAuthority: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
});

export type SplitInfo = Infer<typeof SplitInfo>;
export const SplitInfo = type({
    lamports: number(),
    newSplitAccount: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
});

export type WithdrawInfo = Infer<typeof WithdrawInfo>;
export const WithdrawInfo = type({
    destination: PublicKeyFromString,
    lamports: number(),
    stakeAccount: PublicKeyFromString,
    withdrawAuthority: PublicKeyFromString,
});

export type DeactivateInfo = Infer<typeof DeactivateInfo>;
export const DeactivateInfo = type({
    stakeAccount: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
});

// SIMD-0490 makes sysvar account inputs optional — accept Merge with or without them.
export type MergeInfo = Infer<typeof MergeInfo>;
export const MergeInfo = type({
    clockSysvar: optional(PublicKeyFromString),
    destination: PublicKeyFromString,
    source: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
    stakeHistorySysvar: optional(PublicKeyFromString),
});

const SetLockupArgs = type({
    custodian: optional(PublicKeyFromString),
    epoch: optional(number()),
    unixTimestamp: optional(number()),
});

export type SetLockupInfo = Infer<typeof SetLockupInfo>;
export const SetLockupInfo = type({
    custodian: PublicKeyFromString,
    lockup: SetLockupArgs,
    stakeAccount: PublicKeyFromString,
});

export type SetLockupCheckedInfo = Infer<typeof SetLockupCheckedInfo>;
export const SetLockupCheckedInfo = type({
    custodian: PublicKeyFromString,
    lockup: SetLockupArgs,
    stakeAccount: PublicKeyFromString,
});

export type AuthorizeWithSeedInfo = Infer<typeof AuthorizeWithSeedInfo>;
export const AuthorizeWithSeedInfo = type({
    authorityBase: PublicKeyFromString,
    authorityOwner: PublicKeyFromString,
    authoritySeed: string(),
    authorityType: string(),
    clockSysvar: optional(PublicKeyFromString),
    custodian: optional(PublicKeyFromString),
    newAuthorized: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
});

export type InitializeCheckedInfo = Infer<typeof InitializeCheckedInfo>;
export const InitializeCheckedInfo = type({
    rentSysvar: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
    staker: PublicKeyFromString,
    withdrawer: PublicKeyFromString,
});

export type AuthorizeCheckedInfo = Infer<typeof AuthorizeCheckedInfo>;
export const AuthorizeCheckedInfo = type({
    authority: PublicKeyFromString,
    authorityType: string(),
    clockSysvar: PublicKeyFromString,
    custodian: optional(PublicKeyFromString),
    newAuthority: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
});

export type AuthorizeCheckedWithSeedInfo = Infer<typeof AuthorizeCheckedWithSeedInfo>;
export const AuthorizeCheckedWithSeedInfo = type({
    authorityBase: PublicKeyFromString,
    authorityOwner: PublicKeyFromString,
    authoritySeed: string(),
    authorityType: string(),
    clockSysvar: PublicKeyFromString,
    custodian: optional(PublicKeyFromString),
    newAuthorized: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
});

export type MoveStakeInfo = Infer<typeof MoveStakeInfo>;
export const MoveStakeInfo = type({
    destination: PublicKeyFromString,
    lamports: number(),
    source: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
});

export type MoveLamportsInfo = Infer<typeof MoveLamportsInfo>;
export const MoveLamportsInfo = type({
    destination: PublicKeyFromString,
    lamports: number(),
    source: PublicKeyFromString,
    stakeAuthority: PublicKeyFromString,
});

export type DeactivateDelinquentInfo = Infer<typeof DeactivateDelinquentInfo>;
export const DeactivateDelinquentInfo = type({
    referenceVoteAccount: PublicKeyFromString,
    stakeAccount: PublicKeyFromString,
    voteAccount: PublicKeyFromString,
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
