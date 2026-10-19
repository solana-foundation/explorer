import { type Address, getU32Decoder, type ReadonlyUint8Array } from '@solana/kit';

// No @solana-program/vote package is published, so the native program address is pinned here.
export const VOTE_PROGRAM_ADDRESS = 'Vote111111111111111111111111111111111111111' as Address;

/** Variants of the vote program's `VoteInstruction`, numbered by their bincode `u32` discriminant. */
export enum VoteInstruction {
    InitializeAccount,
    Authorize,
    Vote,
    Withdraw,
    UpdateValidatorIdentity,
    UpdateCommission,
    VoteSwitch,
    AuthorizeChecked,
    UpdateVoteState,
    UpdateVoteStateSwitch,
    AuthorizeWithSeed,
    AuthorizeCheckedWithSeed,
    CompactUpdateVoteState,
    CompactUpdateVoteStateSwitch,
    TowerSync,
    TowerSyncSwitch,
    InitializeAccountV2,
    UpdateCommissionCollector,
    UpdateCommissionBps,
    DepositDelegatorRewards,
}

/** Throws when the data is shorter than the discriminant or names no `VoteInstruction` variant. */
export function identifyVoteInstruction(data: ReadonlyUint8Array): VoteInstruction {
    const discriminant = getU32Decoder().decode(data.subarray(0, 4));
    if (!(discriminant in VoteInstruction)) {
        throw new Error(`Unknown vote instruction discriminant: ${discriminant}`);
    }
    return discriminant;
}
