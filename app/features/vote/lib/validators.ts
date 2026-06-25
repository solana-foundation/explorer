import { PublicKeyFromString } from '@validators/pubkey';
import { array, enums, Infer, nullable, number, optional, string, type } from 'superstruct';

export type VoteAccountType = Infer<typeof VoteAccountType>;
export const VoteAccountType = enums(['vote']);

export type AuthorizedVoter = Infer<typeof AuthorizedVoter>;
export const AuthorizedVoter = type({
    authorizedVoter: PublicKeyFromString,
    epoch: number(),
});

export type PriorVoter = Infer<typeof PriorVoter>;
export const PriorVoter = type({
    authorizedPubkey: PublicKeyFromString,
    epochOfLastAuthorizedSwitch: number(),
    targetEpoch: number(),
});

export type EpochCredits = Infer<typeof EpochCredits>;
export const EpochCredits = type({
    credits: string(),
    epoch: number(),
    previousCredits: string(),
});

// agave UiLandedVote: `latency` was added when vote-state lockouts became LandedVote;
// nodes running older account decoders emit plain lockouts without it.
export type Vote = Infer<typeof Vote>;
export const Vote = type({
    confirmationCount: number(),
    latency: optional(number()),
    slot: number(),
});

// Mirrors agave account-decoder UiVoteState. The optional fields arrived with vote
// state v4 (SIMD-0185) and are absent on nodes running older decoders; `priorVoters`
// is always empty for v4 accounts.
export type VoteAccountInfo = Infer<typeof VoteAccountInfo>;
export const VoteAccountInfo = type({
    authorizedVoters: array(AuthorizedVoter),
    authorizedWithdrawer: PublicKeyFromString,
    blockRevenueCollector: optional(PublicKeyFromString),
    blockRevenueCommissionBps: optional(number()),
    blsPubkeyCompressed: optional(nullable(string())),
    commission: number(),
    epochCredits: array(EpochCredits),
    inflationRewardsCollector: optional(PublicKeyFromString),
    inflationRewardsCommissionBps: optional(number()),
    lastTimestamp: type({
        slot: number(),
        timestamp: number(),
    }),
    nodePubkey: PublicKeyFromString,
    pendingDelegatorRewards: optional(string()),
    priorVoters: array(PriorVoter),
    rootSlot: nullable(number()),
    votes: array(Vote),
});

export type VoteAccount = Infer<typeof VoteAccount>;
export const VoteAccount = type({
    info: VoteAccountInfo,
    type: VoteAccountType,
});
