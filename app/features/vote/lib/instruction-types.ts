import { AddressFromString } from '@validators/pubkey';
import { array, enums, Infer, nullable, number, optional, string, type, union } from 'superstruct';

// Serde forms of agave's VoteAuthorize enum: unit variants serialize as strings
// ("Voter" / "Withdrawer"), the SIMD-0387 BLS variant as an externally-tagged object.
export type VoteAuthorityType = Infer<typeof VoteAuthorityType>;
export const VoteAuthorityType = union([
    enums(['Voter', 'Withdrawer']),
    type({
        VoterWithBLS: type({
            bls_proof_of_possession: array(number()),
            bls_pubkey: array(number()),
        }),
    }),
]);

// agave's CommissionKind enum (SIMD-0185); unit variants serialize as strings.
export type CommissionKind = Infer<typeof CommissionKind>;
export const CommissionKind = enums(['BlockRevenue', 'InflationRewards']);

export type Lockout = Infer<typeof Lockout>;
export const Lockout = type({
    confirmation_count: number(),
    slot: number(),
});

export type InitializeInfo = Infer<typeof InitializeInfo>;
export const InitializeInfo = type({
    authorizedVoter: AddressFromString,
    authorizedWithdrawer: AddressFromString,
    clockSysvar: AddressFromString,
    commission: number(),
    node: AddressFromString,
    rentSysvar: AddressFromString,
    voteAccount: AddressFromString,
});

export type InitializeV2Info = Infer<typeof InitializeV2Info>;
export const InitializeV2Info = type({
    authorizedVoter: AddressFromString,
    authorizedVoterBlsProofOfPossession: string(),
    authorizedVoterBlsPubkey: string(),
    authorizedWithdrawer: AddressFromString,
    blockRevenueCollector: AddressFromString,
    blockRevenueCommissionBps: number(),
    inflationRewardsCollector: AddressFromString,
    inflationRewardsCommissionBps: number(),
    node: AddressFromString,
    voteAccount: AddressFromString,
});

// Covers both "authorize" and "authorizeChecked"
export type AuthorizeInfo = Infer<typeof AuthorizeInfo>;
export const AuthorizeInfo = type({
    authority: AddressFromString,
    authorityType: VoteAuthorityType,
    clockSysvar: AddressFromString,
    newAuthority: AddressFromString,
    voteAccount: AddressFromString,
});

// Covers both "authorizeWithSeed" and "authorizeCheckedWithSeed"
export type AuthorizeWithSeedInfo = Infer<typeof AuthorizeWithSeedInfo>;
export const AuthorizeWithSeedInfo = type({
    authorityBaseKey: AddressFromString,
    authorityOwner: AddressFromString,
    authoritySeed: string(),
    authorityType: VoteAuthorityType,
    clockSysvar: AddressFromString,
    newAuthority: AddressFromString,
    voteAccount: AddressFromString,
});

// Covers "vote" and "voteSwitch"; the switch variant adds a top-level hash.
export type VoteInfo = Infer<typeof VoteInfo>;
export const VoteInfo = type({
    clockSysvar: AddressFromString,
    hash: optional(string()),
    slotHashesSysvar: AddressFromString,
    vote: type({
        hash: string(),
        slots: array(number()),
        timestamp: optional(nullable(number())),
    }),
    voteAccount: AddressFromString,
    voteAuthority: AddressFromString,
});

// Covers "updatevotestate", "updatevotestateswitch", "compactupdatevotestate"
// and "compactupdatevotestateswitch"; the switch variants add a top-level hash.
export type UpdateVoteStateInfo = Infer<typeof UpdateVoteStateInfo>;
export const UpdateVoteStateInfo = type({
    hash: optional(string()),
    voteAccount: AddressFromString,
    voteAuthority: AddressFromString,
    voteStateUpdate: type({
        hash: string(),
        lockouts: array(Lockout),
        root: optional(nullable(number())),
        timestamp: optional(nullable(number())),
    }),
});

// Covers "towersync" and "towersyncswitch"; the switch variant adds a top-level hash.
export type TowerSyncInfo = Infer<typeof TowerSyncInfo>;
export const TowerSyncInfo = type({
    hash: optional(string()),
    towerSync: type({
        blockId: string(),
        hash: string(),
        lockouts: array(Lockout),
        root: optional(nullable(number())),
        timestamp: optional(nullable(number())),
    }),
    voteAccount: AddressFromString,
    voteAuthority: AddressFromString,
});

export type WithdrawInfo = Infer<typeof WithdrawInfo>;
export const WithdrawInfo = type({
    destination: AddressFromString,
    lamports: number(),
    voteAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type UpdateValidatorIdentityInfo = Infer<typeof UpdateValidatorIdentityInfo>;
export const UpdateValidatorIdentityInfo = type({
    newValidatorIdentity: AddressFromString,
    voteAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type UpdateCommissionInfo = Infer<typeof UpdateCommissionInfo>;
export const UpdateCommissionInfo = type({
    commission: number(),
    voteAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type UpdateCommissionBpsInfo = Infer<typeof UpdateCommissionBpsInfo>;
export const UpdateCommissionBpsInfo = type({
    commissionBps: number(),
    commissionKind: CommissionKind,
    voteAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type UpdateCommissionCollectorInfo = Infer<typeof UpdateCommissionCollectorInfo>;
export const UpdateCommissionCollectorInfo = type({
    commissionKind: CommissionKind,
    newCollector: AddressFromString,
    voteAccount: AddressFromString,
    withdrawAuthority: AddressFromString,
});

export type DepositDelegatorRewardsInfo = Infer<typeof DepositDelegatorRewardsInfo>;
export const DepositDelegatorRewardsInfo = type({
    deposit: number(),
    source: AddressFromString,
    voteAccount: AddressFromString,
});
