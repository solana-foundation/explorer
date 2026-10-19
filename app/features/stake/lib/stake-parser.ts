import {
    isParsedInstructionProgram,
    type KitInstruction,
    type ParsedInstructionInfo,
    type ParserProgramLabel,
    STAKE_PROGRAM_LABEL,
} from '@explorer/parsers';
import { type Address, address, type Option, unwrapOption } from '@solana/kit';
import type { ParsedInstruction } from '@solana/web3.js';
import {
    getAuthorizeCheckedInstructionDataDecoder,
    getAuthorizeCheckedWithSeedInstructionDataDecoder,
    getAuthorizeInstructionDataDecoder,
    getAuthorizeWithSeedInstructionDataDecoder,
    getInitializeInstructionDataDecoder,
    getMoveLamportsInstructionDataDecoder,
    getMoveStakeInstructionDataDecoder,
    getSetLockupCheckedInstructionDataDecoder,
    getSetLockupInstructionDataDecoder,
    getSplitInstructionDataDecoder,
    getWithdrawInstructionDataDecoder,
    identifyStakeInstruction,
    STAKE_PROGRAM_ADDRESS,
    StakeAuthorize,
    StakeInstruction,
} from '@solana-program/stake';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import {
    AuthorizeCheckedInfo,
    AuthorizeCheckedWithSeedInfo,
    AuthorizeInfo,
    AuthorizeWithSeedInfo,
    DeactivateDelinquentInfo,
    DeactivateInfo,
    DelegateInfo,
    InitializeCheckedInfo,
    InitializeInfo,
    MergeInfo,
    MoveLamportsInfo,
    MoveStakeInfo,
    SetLockupCheckedInfo,
    SetLockupInfo,
    SplitInfo,
    WithdrawInfo,
} from './instruction-types';

export { STAKE_PROGRAM_ADDRESS };

/** RPC `parsed.program` discriminator for the Stake program; also the slice's `programLabel`. */
export const STAKE_PARSER_LABEL = STAKE_PROGRAM_LABEL satisfies ParserProgramLabel;

/**
 * Canonical shape for a parsed Stake instruction. The type strings, the `info` field names and the
 * legacy-or-current account layout are the RPC's (Agave `parse_stake`), so both paths feed one card.
 */
export type StakeParsed =
    | ParsedInstructionInfo<'initialize', InitializeInfo>
    | ParsedInstructionInfo<'authorize', AuthorizeInfo>
    | ParsedInstructionInfo<'delegate', DelegateInfo>
    | ParsedInstructionInfo<'split', SplitInfo>
    | ParsedInstructionInfo<'withdraw', WithdrawInfo>
    | ParsedInstructionInfo<'deactivate', DeactivateInfo>
    | ParsedInstructionInfo<'setLockup', SetLockupInfo>
    | ParsedInstructionInfo<'merge', MergeInfo>
    | ParsedInstructionInfo<'authorizeWithSeed', AuthorizeWithSeedInfo>
    | ParsedInstructionInfo<'initializeChecked', InitializeCheckedInfo>
    | ParsedInstructionInfo<'authorizeChecked', AuthorizeCheckedInfo>
    | ParsedInstructionInfo<'authorizeCheckedWithSeed', AuthorizeCheckedWithSeedInfo>
    | ParsedInstructionInfo<'setLockupChecked', SetLockupCheckedInfo>
    | ParsedInstructionInfo<'getMinimumDelegation', undefined>
    | ParsedInstructionInfo<'deactivateDelinquent', DeactivateDelinquentInfo>
    | ParsedInstructionInfo<'moveStake', MoveStakeInfo>
    | ParsedInstructionInfo<'moveLamports', MoveLamportsInfo>;

const CLOCK_SYSVAR = address('SysvarC1ock11111111111111111111111111111111');
const RENT_SYSVAR = address('SysvarRent111111111111111111111111111111111');

export function parseStakeKitInstruction(ix: KitInstruction): StakeParsed | undefined {
    try {
        return decodeStakeInstruction(ix);
    } catch {
        // An unknown discriminator or a short account list; the dispatcher renders that as unknown.
        return undefined;
    }
}

/** Normalise an RPC-pre-parsed Stake instruction into `StakeParsed`. */
export function parseStakeRpcInstruction(ix: ParsedInstruction): StakeParsed | undefined {
    if (!isParsedInstructionProgram(ix, STAKE_PARSER_LABEL)) return undefined;
    const { info, type } = ix.parsed;
    try {
        switch (type) {
            case 'initialize':
                return { info: create(info, InitializeInfo), type };
            case 'authorize':
                return { info: create(info, AuthorizeInfo), type };
            case 'delegate':
                return { info: create(info, DelegateInfo), type };
            case 'split':
                return { info: create(info, SplitInfo), type };
            case 'withdraw':
                return { info: create(info, WithdrawInfo), type };
            case 'deactivate':
                return { info: create(info, DeactivateInfo), type };
            case 'setLockup':
                return { info: create(info, SetLockupInfo), type };
            case 'merge':
                return { info: create(info, MergeInfo), type };
            case 'authorizeWithSeed':
                return { info: create(info, AuthorizeWithSeedInfo), type };
            case 'initializeChecked':
                return { info: create(info, InitializeCheckedInfo), type };
            case 'authorizeChecked':
                return { info: create(info, AuthorizeCheckedInfo), type };
            case 'authorizeCheckedWithSeed':
                return { info: create(info, AuthorizeCheckedWithSeedInfo), type };
            case 'setLockupChecked':
                return { info: create(info, SetLockupCheckedInfo), type };
            case 'getMinimumDelegation':
                return { info: undefined, type };
            case 'deactivateDelinquent':
                return { info: create(info, DeactivateDelinquentInfo), type };
            case 'moveStake':
                return { info: create(info, MoveStakeInfo), type };
            case 'moveLamports':
                return { info: create(info, MoveLamportsInfo), type };
            default:
                return undefined;
        }
    } catch (error) {
        // The program label already matched, so a validation failure here means the RPC sent a payload
        // we don't model — worth surfacing. Returning undefined falls back to the unknown-instruction card.
        Logger.error(error, { instructionType: type, program: ix.program });
        return undefined;
    }
}

function decodeStakeInstruction(ix: KitInstruction): StakeParsed {
    const key = (index: number): Address => {
        const meta = ix.accounts[index];
        if (!meta) throw new Error(`stake: missing account ${index}`);
        return meta.address;
    };
    const optionalKey = (index: number) => (ix.accounts.length > index ? key(index) : undefined);
    // Builders that follow SIMD-0490 drop the sysvar accounts, so the layout is told apart by the
    // account at the sysvar's legacy position, as the RPC does.
    const holds = (index: number, sysvar: Address) => ix.accounts[index]?.address === sysvar;

    switch (identifyStakeInstruction(ix.data)) {
        case StakeInstruction.Initialize: {
            const { arg0: authorized, arg1: lockup } = getInitializeInstructionDataDecoder().decode(ix.data);
            const info = {
                authorized,
                lockup: {
                    custodian: lockup.custodian,
                    epoch: Number(lockup.epoch),
                    unixTimestamp: Number(lockup.unixTimestamp),
                },
                rentSysvar: holds(1, RENT_SYSVAR) ? key(1) : undefined,
                stakeAccount: key(0),
            };
            return { info: create(info, InitializeInfo), type: 'initialize' };
        }
        case StakeInstruction.Authorize: {
            const legacy = holds(1, CLOCK_SYSVAR);
            const authority = legacy ? 2 : 1;
            const { arg0: newAuthority, arg1: authorityType } = getAuthorizeInstructionDataDecoder().decode(ix.data);
            const info = {
                authority: key(authority),
                authorityType: StakeAuthorize[authorityType],
                clockSysvar: legacy ? key(1) : undefined,
                custodian: optionalKey(authority + 1),
                newAuthority,
                stakeAccount: key(0),
            };
            return { info: create(info, AuthorizeInfo), type: 'authorize' };
        }
        case StakeInstruction.DelegateStake: {
            const legacy = holds(2, CLOCK_SYSVAR);
            const info = {
                clockSysvar: legacy ? key(2) : undefined,
                stakeAccount: key(0),
                stakeAuthority: key(legacy ? 5 : 2),
                stakeConfigAccount: legacy ? key(4) : undefined,
                stakeHistorySysvar: legacy ? key(3) : undefined,
                voteAccount: key(1),
            };
            return { info: create(info, DelegateInfo), type: 'delegate' };
        }
        case StakeInstruction.Split: {
            const info = {
                lamports: Number(getSplitInstructionDataDecoder().decode(ix.data).args),
                newSplitAccount: key(1),
                stakeAccount: key(0),
                stakeAuthority: key(2),
            };
            return { info: create(info, SplitInfo), type: 'split' };
        }
        case StakeInstruction.Withdraw: {
            const legacy = holds(2, CLOCK_SYSVAR);
            const authority = legacy ? 4 : 2;
            const info = {
                clockSysvar: legacy ? key(2) : undefined,
                custodian: optionalKey(authority + 1),
                destination: key(1),
                lamports: Number(getWithdrawInstructionDataDecoder().decode(ix.data).args),
                stakeAccount: key(0),
                stakeHistorySysvar: legacy ? key(3) : undefined,
                withdrawAuthority: key(authority),
            };
            return { info: create(info, WithdrawInfo), type: 'withdraw' };
        }
        case StakeInstruction.Deactivate: {
            const legacy = holds(1, CLOCK_SYSVAR);
            const info = {
                clockSysvar: legacy ? key(1) : undefined,
                stakeAccount: key(0),
                stakeAuthority: key(legacy ? 2 : 1),
            };
            return { info: create(info, DeactivateInfo), type: 'deactivate' };
        }
        case StakeInstruction.SetLockup: {
            const lockup = getSetLockupInstructionDataDecoder().decode(ix.data);
            const info = {
                custodian: key(1),
                lockup: { ...lockupArgs(lockup), custodian: unwrapOption(lockup.custodian) ?? undefined },
                stakeAccount: key(0),
            };
            return { info: create(info, SetLockupInfo), type: 'setLockup' };
        }
        case StakeInstruction.Merge: {
            const legacy = holds(2, CLOCK_SYSVAR);
            const info = {
                clockSysvar: legacy ? key(2) : undefined,
                destination: key(0),
                source: key(1),
                stakeAuthority: key(legacy ? 4 : 2),
                stakeHistorySysvar: legacy ? key(3) : undefined,
            };
            return { info: create(info, MergeInfo), type: 'merge' };
        }
        case StakeInstruction.AuthorizeWithSeed: {
            const legacy = holds(2, CLOCK_SYSVAR);
            const data = getAuthorizeWithSeedInstructionDataDecoder().decode(ix.data);
            const info = {
                authorityBase: key(1),
                authorityOwner: data.authorityOwner,
                authoritySeed: data.authoritySeed,
                authorityType: StakeAuthorize[data.stakeAuthorize],
                clockSysvar: legacy ? key(2) : undefined,
                custodian: optionalKey(legacy ? 3 : 2),
                newAuthorized: data.newAuthorizedPubkey,
                stakeAccount: key(0),
            };
            return { info: create(info, AuthorizeWithSeedInfo), type: 'authorizeWithSeed' };
        }
        case StakeInstruction.InitializeChecked: {
            const legacy = holds(1, RENT_SYSVAR);
            const staker = legacy ? 2 : 1;
            const info = {
                rentSysvar: legacy ? key(1) : undefined,
                stakeAccount: key(0),
                staker: key(staker),
                withdrawer: key(staker + 1),
            };
            return { info: create(info, InitializeCheckedInfo), type: 'initializeChecked' };
        }
        case StakeInstruction.AuthorizeChecked: {
            const legacy = holds(1, CLOCK_SYSVAR);
            const authority = legacy ? 2 : 1;
            const info = {
                authority: key(authority),
                authorityType:
                    StakeAuthorize[getAuthorizeCheckedInstructionDataDecoder().decode(ix.data).stakeAuthorize],
                clockSysvar: legacy ? key(1) : undefined,
                custodian: optionalKey(authority + 2),
                newAuthority: key(authority + 1),
                stakeAccount: key(0),
            };
            return { info: create(info, AuthorizeCheckedInfo), type: 'authorizeChecked' };
        }
        case StakeInstruction.AuthorizeCheckedWithSeed: {
            const legacy = holds(2, CLOCK_SYSVAR);
            const newAuthorized = legacy ? 3 : 2;
            const data = getAuthorizeCheckedWithSeedInstructionDataDecoder().decode(ix.data);
            const info = {
                authorityBase: key(1),
                authorityOwner: data.authorityOwner,
                authoritySeed: data.authoritySeed,
                authorityType: StakeAuthorize[data.stakeAuthorize],
                clockSysvar: legacy ? key(2) : undefined,
                custodian: optionalKey(newAuthorized + 1),
                newAuthorized: key(newAuthorized),
                stakeAccount: key(0),
            };
            return { info: create(info, AuthorizeCheckedWithSeedInfo), type: 'authorizeCheckedWithSeed' };
        }
        case StakeInstruction.SetLockupChecked: {
            const info = {
                custodian: key(1),
                lockup: {
                    ...lockupArgs(getSetLockupCheckedInstructionDataDecoder().decode(ix.data)),
                    custodian: optionalKey(2),
                },
                stakeAccount: key(0),
            };
            return { info: create(info, SetLockupCheckedInfo), type: 'setLockupChecked' };
        }
        case StakeInstruction.GetMinimumDelegation:
            return { info: undefined, type: 'getMinimumDelegation' };
        case StakeInstruction.DeactivateDelinquent: {
            const info = { referenceVoteAccount: key(2), stakeAccount: key(0), voteAccount: key(1) };
            return { info: create(info, DeactivateDelinquentInfo), type: 'deactivateDelinquent' };
        }
        case StakeInstruction.MoveStake: {
            const info = {
                destination: key(1),
                lamports: Number(getMoveStakeInstructionDataDecoder().decode(ix.data).args),
                source: key(0),
                stakeAuthority: key(2),
            };
            return { info: create(info, MoveStakeInfo), type: 'moveStake' };
        }
        case StakeInstruction.MoveLamports: {
            const info = {
                destination: key(1),
                lamports: Number(getMoveLamportsInstructionDataDecoder().decode(ix.data).args),
                source: key(0),
                stakeAuthority: key(2),
            };
            return { info: create(info, MoveLamportsInfo), type: 'moveLamports' };
        }
    }
}

function lockupArgs({ epoch, unixTimestamp }: { epoch: Option<bigint>; unixTimestamp: Option<bigint> }) {
    return { epoch: optionalNumber(epoch), unixTimestamp: optionalNumber(unixTimestamp) };
}

function optionalNumber(value: Option<bigint>) {
    const unwrapped = unwrapOption(value);
    return unwrapped === null ? undefined : Number(unwrapped);
}
