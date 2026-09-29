import { identifyStakeInstruction, StakeInstruction } from '@solana-program/stake';

// Discriminated union of how the raw stake-instruction card should dispatch:
//   - getMinimumDelegation: render the dedicated raw card
//   - unsupported:          identified, but the raw path doesn't decode it (parsed
//                           path in StakeDetailsCard owns these); fall back to Unknown
//   - invalid:              identifyStakeInstruction() threw — discriminator didn't
//                           match any known stake instruction
export type RawStakeInstructionClassification =
    | { kind: 'getMinimumDelegation' }
    | { kind: 'unsupported' }
    | { kind: 'invalid'; error: unknown };

export function classifyRawStakeInstruction(data: Buffer): RawStakeInstructionClassification {
    let instructionType: StakeInstruction;
    try {
        instructionType = identifyStakeInstruction(data);
    } catch (error) {
        return { error, kind: 'invalid' };
    }
    switch (instructionType) {
        case StakeInstruction.GetMinimumDelegation:
            return { kind: 'getMinimumDelegation' };
        case StakeInstruction.Initialize:
        case StakeInstruction.Authorize:
        case StakeInstruction.DelegateStake:
        case StakeInstruction.Split:
        case StakeInstruction.Withdraw:
        case StakeInstruction.Deactivate:
        case StakeInstruction.SetLockup:
        case StakeInstruction.Merge:
        case StakeInstruction.AuthorizeWithSeed:
        case StakeInstruction.InitializeChecked:
        case StakeInstruction.AuthorizeChecked:
        case StakeInstruction.AuthorizeCheckedWithSeed:
        case StakeInstruction.SetLockupChecked:
        case StakeInstruction.DeactivateDelinquent:
        case StakeInstruction.MoveStake:
        case StakeInstruction.MoveLamports:
            return { kind: 'unsupported' };
    }
    // Compile-time exhaustiveness guard: if @solana-program/stake adds a new
    // StakeInstruction variant, this assignment fails and forces this switch
    // to be updated rather than silently routing the new variant to Unknown.
    const _exhaustive: never = instructionType;
    return _exhaustive;
}
