import { gen } from '@__fixtures__/gen';
import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import type { KitInstruction } from '@explorer/parsers';
import {
    type AccountMeta,
    address,
    createNoopSigner,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    isSignerRole,
    isWritableRole,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getAuthorizeCheckedInstruction,
    getAuthorizeCheckedWithSeedInstruction,
    getAuthorizeInstruction,
    getAuthorizeWithSeedInstruction,
    getDeactivateDelinquentInstruction,
    getDeactivateInstruction,
    getDelegateStakeInstruction,
    getGetMinimumDelegationInstruction,
    getInitializeCheckedInstruction,
    getInitializeInstruction,
    getMergeInstruction,
    getMoveLamportsInstruction,
    getMoveStakeInstruction,
    getSetLockupCheckedInstruction,
    getSetLockupInstruction,
    getSplitInstruction,
    getWithdrawInstruction,
    StakeAuthorize,
} from '@solana-program/stake';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { stakeInstructionParser } from '../stake-client';
import {
    parseStakeKitInstruction,
    parseStakeRpcInstruction,
    STAKE_PARSER_LABEL,
    STAKE_PROGRAM_ADDRESS,
} from '../stake-parser';

const STAKE = address(gen.address(1));
const AUTHORITY = address(gen.address(2));
const NEW_AUTHORITY = address(gen.address(3));
const CUSTODIAN = address(gen.address(4));
const DESTINATION = address(gen.address(5));
const VOTE = address(gen.address(6));
const REFERENCE_VOTE = address(gen.address(7));
const BASE = address(gen.address(8));
const OWNER = address(gen.address(9));
const CLOCK = address('SysvarC1ock11111111111111111111111111111111');
const RENT = address('SysvarRent111111111111111111111111111111111');
const STAKE_HISTORY = address('SysvarStakeHistory1111111111111111111111111');
const STAKE_CONFIG = address('StakeConfig11111111111111111111111111111111');

const signer = createNoopSigner;
const dispatcher = createInstructionParserDispatcher([stakeInstructionParser]);

type BuiltInstruction = Instruction &
    InstructionWithAccounts<readonly AccountMeta[]> &
    InstructionWithData<ReadonlyUint8Array>;

/** `info` is the JSON Agave `parse_stake` emits for the same instruction. */
const CASES: Array<{ name: string; ix: BuiltInstruction; type: string; info: unknown }> = [
    {
        info: {
            authorized: { staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
            lockup: { custodian: CUSTODIAN, epoch: 400, unixTimestamp: 1_700_000_000 },
            rentSysvar: RENT,
            stakeAccount: STAKE,
        },
        ix: getInitializeInstruction({
            arg0: { staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
            arg1: { custodian: CUSTODIAN, epoch: 400, unixTimestamp: 1_700_000_000 },
            stake: STAKE,
        }),
        name: 'initialize with stakeAccount, rentSysvar, authorized and lockup',
        type: 'initialize',
    },
    {
        info: {
            authority: AUTHORITY,
            authorityType: 'Withdrawer',
            clockSysvar: CLOCK,
            newAuthority: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: getAuthorizeInstruction({
            arg0: NEW_AUTHORITY,
            arg1: StakeAuthorize.Withdrawer,
            authority: signer(AUTHORITY),
            stake: STAKE,
        }),
        name: 'authorize with clockSysvar and no custodian',
        type: 'authorize',
    },
    {
        info: {
            authority: AUTHORITY,
            authorityType: 'Staker',
            clockSysvar: CLOCK,
            custodian: CUSTODIAN,
            newAuthority: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: getAuthorizeInstruction({
            arg0: NEW_AUTHORITY,
            arg1: StakeAuthorize.Staker,
            authority: signer(AUTHORITY),
            lockupAuthority: signer(CUSTODIAN),
            stake: STAKE,
        }),
        name: 'authorize with custodian',
        type: 'authorize',
    },
    {
        info: {
            clockSysvar: CLOCK,
            stakeAccount: STAKE,
            stakeAuthority: AUTHORITY,
            stakeConfigAccount: STAKE_CONFIG,
            stakeHistorySysvar: STAKE_HISTORY,
            voteAccount: VOTE,
        },
        ix: getDelegateStakeInstruction({
            stake: STAKE,
            stakeAuthority: signer(AUTHORITY),
            unused: STAKE_CONFIG,
            vote: VOTE,
        }),
        name: 'delegate with clockSysvar, stakeHistorySysvar and stakeConfigAccount',
        type: 'delegate',
    },
    {
        info: { lamports: 2_000_000_000, newSplitAccount: DESTINATION, stakeAccount: STAKE, stakeAuthority: AUTHORITY },
        ix: getSplitInstruction({
            args: 2_000_000_000n,
            splitStake: DESTINATION,
            stake: STAKE,
            stakeAuthority: signer(AUTHORITY),
        }),
        name: 'split with newSplitAccount and lamports',
        type: 'split',
    },
    {
        info: {
            clockSysvar: CLOCK,
            custodian: CUSTODIAN,
            destination: DESTINATION,
            lamports: 1_500_000,
            stakeAccount: STAKE,
            stakeHistorySysvar: STAKE_HISTORY,
            withdrawAuthority: AUTHORITY,
        },
        ix: getWithdrawInstruction({
            args: 1_500_000n,
            lockupAuthority: signer(CUSTODIAN),
            recipient: DESTINATION,
            stake: STAKE,
            withdrawAuthority: signer(AUTHORITY),
        }),
        name: 'withdraw with destination, sysvars and custodian',
        type: 'withdraw',
    },
    {
        info: { clockSysvar: CLOCK, stakeAccount: STAKE, stakeAuthority: AUTHORITY },
        ix: getDeactivateInstruction({ stake: STAKE, stakeAuthority: signer(AUTHORITY) }),
        name: 'deactivate with clockSysvar',
        type: 'deactivate',
    },
    {
        info: {
            custodian: AUTHORITY,
            lockup: { custodian: CUSTODIAN, epoch: 500, unixTimestamp: 1_800_000_000 },
            stakeAccount: STAKE,
        },
        ix: getSetLockupInstruction({
            authority: signer(AUTHORITY),
            custodian: CUSTODIAN,
            epoch: 500,
            stake: STAKE,
            unixTimestamp: 1_800_000_000,
        }),
        name: 'setLockup with the signer as custodian and every lockup arg',
        type: 'setLockup',
    },
    {
        info: { custodian: AUTHORITY, lockup: { epoch: 500 }, stakeAccount: STAKE },
        ix: getSetLockupInstruction({
            authority: signer(AUTHORITY),
            custodian: null,
            epoch: 500,
            stake: STAKE,
            unixTimestamp: null,
        }),
        name: 'setLockup omitting unset lockup args',
        type: 'setLockup',
    },
    {
        info: {
            clockSysvar: CLOCK,
            destination: DESTINATION,
            source: STAKE,
            stakeAuthority: AUTHORITY,
            stakeHistorySysvar: STAKE_HISTORY,
        },
        ix: getMergeInstruction({
            destinationStake: DESTINATION,
            sourceStake: STAKE,
            stakeAuthority: signer(AUTHORITY),
        }),
        name: 'merge with destination, source and sysvars',
        type: 'merge',
    },
    {
        info: {
            authorityBase: BASE,
            authorityOwner: OWNER,
            authoritySeed: 'stake:0',
            authorityType: 'Staker',
            clockSysvar: CLOCK,
            custodian: CUSTODIAN,
            newAuthorized: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: getAuthorizeWithSeedInstruction({
            authorityOwner: OWNER,
            authoritySeed: 'stake:0',
            base: signer(BASE),
            lockupAuthority: signer(CUSTODIAN),
            newAuthorizedPubkey: NEW_AUTHORITY,
            stake: STAKE,
            stakeAuthorize: StakeAuthorize.Staker,
        }),
        name: 'authorizeWithSeed with authorityBase, authoritySeed, authorityOwner and custodian',
        type: 'authorizeWithSeed',
    },
    {
        info: { rentSysvar: RENT, stakeAccount: STAKE, staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
        ix: getInitializeCheckedInstruction({
            stake: STAKE,
            stakeAuthority: AUTHORITY,
            withdrawAuthority: signer(NEW_AUTHORITY),
        }),
        name: 'initializeChecked with rentSysvar, staker and withdrawer',
        type: 'initializeChecked',
    },
    {
        info: {
            authority: AUTHORITY,
            authorityType: 'Withdrawer',
            clockSysvar: CLOCK,
            newAuthority: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: getAuthorizeCheckedInstruction({
            authority: signer(AUTHORITY),
            newAuthority: signer(NEW_AUTHORITY),
            stake: STAKE,
            stakeAuthorize: StakeAuthorize.Withdrawer,
        }),
        name: 'authorizeChecked with newAuthority from the accounts',
        type: 'authorizeChecked',
    },
    {
        info: {
            authorityBase: BASE,
            authorityOwner: OWNER,
            authoritySeed: 'seed',
            authorityType: 'Withdrawer',
            clockSysvar: CLOCK,
            custodian: CUSTODIAN,
            newAuthorized: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: getAuthorizeCheckedWithSeedInstruction({
            authorityOwner: OWNER,
            authoritySeed: 'seed',
            base: signer(BASE),
            lockupAuthority: signer(CUSTODIAN),
            newAuthority: signer(NEW_AUTHORITY),
            stake: STAKE,
            stakeAuthorize: StakeAuthorize.Withdrawer,
        }),
        name: 'authorizeCheckedWithSeed with newAuthorized from the accounts and custodian',
        type: 'authorizeCheckedWithSeed',
    },
    {
        info: { custodian: AUTHORITY, lockup: { custodian: NEW_AUTHORITY, unixTimestamp: 0 }, stakeAccount: STAKE },
        ix: getSetLockupCheckedInstruction({
            authority: signer(AUTHORITY),
            epoch: null,
            newAuthority: signer(NEW_AUTHORITY),
            stake: STAKE,
            unixTimestamp: 0,
        }),
        name: 'setLockupChecked with lockup.custodian from the accounts',
        type: 'setLockupChecked',
    },
    {
        info: { referenceVoteAccount: REFERENCE_VOTE, stakeAccount: STAKE, voteAccount: VOTE },
        ix: getDeactivateDelinquentInstruction({
            delinquentVote: VOTE,
            referenceVote: REFERENCE_VOTE,
            stake: STAKE,
        }),
        name: 'deactivateDelinquent with voteAccount and referenceVoteAccount',
        type: 'deactivateDelinquent',
    },
    {
        info: { destination: DESTINATION, lamports: 42, source: STAKE, stakeAuthority: AUTHORITY },
        ix: getMoveStakeInstruction({
            args: 42n,
            destinationStake: DESTINATION,
            sourceStake: STAKE,
            stakeAuthority: signer(AUTHORITY),
        }),
        name: 'moveStake with source, destination and lamports',
        type: 'moveStake',
    },
    {
        info: { destination: DESTINATION, lamports: 7, source: STAKE, stakeAuthority: AUTHORITY },
        ix: getMoveLamportsInstruction({
            args: 7n,
            destinationStake: DESTINATION,
            sourceStake: STAKE,
            stakeAuthority: signer(AUTHORITY),
        }),
        name: 'moveLamports with source, destination and lamports',
        type: 'moveLamports',
    },
];

/** Agave tells the SIMD-0490 layout apart from the legacy one by the account at the sysvar slot. */
const CURRENT_LAYOUT_CASES: Array<{ name: string; ix: BuiltInstruction; type: string; info: unknown }> = [
    {
        info: { authority: AUTHORITY, authorityType: 'Staker', newAuthority: NEW_AUTHORITY, stakeAccount: STAKE },
        ix: withoutSysvars(
            getAuthorizeInstruction({
                arg0: NEW_AUTHORITY,
                arg1: StakeAuthorize.Staker,
                authority: signer(AUTHORITY),
                stake: STAKE,
            }),
        ),
        name: 'authorize without clockSysvar',
        type: 'authorize',
    },
    {
        info: {
            authority: AUTHORITY,
            authorityType: 'Withdrawer',
            custodian: CUSTODIAN,
            newAuthority: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: withoutSysvars(
            getAuthorizeInstruction({
                arg0: NEW_AUTHORITY,
                arg1: StakeAuthorize.Withdrawer,
                authority: signer(AUTHORITY),
                lockupAuthority: signer(CUSTODIAN),
                stake: STAKE,
            }),
        ),
        name: 'authorize without clockSysvar, custodian at index 2',
        type: 'authorize',
    },
    {
        info: { stakeAccount: STAKE, stakeAuthority: AUTHORITY, voteAccount: VOTE },
        ix: withoutSysvars(
            getDelegateStakeInstruction({
                stake: STAKE,
                stakeAuthority: signer(AUTHORITY),
                unused: STAKE_CONFIG,
                vote: VOTE,
            }),
        ),
        name: 'delegate without clockSysvar, stakeHistorySysvar and stakeConfigAccount',
        type: 'delegate',
    },
    {
        info: {
            custodian: CUSTODIAN,
            destination: DESTINATION,
            lamports: 1,
            stakeAccount: STAKE,
            withdrawAuthority: AUTHORITY,
        },
        ix: withoutSysvars(
            getWithdrawInstruction({
                args: 1n,
                lockupAuthority: signer(CUSTODIAN),
                recipient: DESTINATION,
                stake: STAKE,
                withdrawAuthority: signer(AUTHORITY),
            }),
        ),
        name: 'withdraw without sysvars, custodian at index 3',
        type: 'withdraw',
    },
    {
        info: { stakeAccount: STAKE, stakeAuthority: AUTHORITY },
        ix: withoutSysvars(getDeactivateInstruction({ stake: STAKE, stakeAuthority: signer(AUTHORITY) })),
        name: 'deactivate without clockSysvar',
        type: 'deactivate',
    },
    {
        info: { destination: DESTINATION, source: STAKE, stakeAuthority: AUTHORITY },
        ix: withoutSysvars(
            getMergeInstruction({
                destinationStake: DESTINATION,
                sourceStake: STAKE,
                stakeAuthority: signer(AUTHORITY),
            }),
        ),
        name: 'merge without clockSysvar and stakeHistorySysvar',
        type: 'merge',
    },
    {
        info: {
            authorityBase: BASE,
            authorityOwner: OWNER,
            authoritySeed: 'stake:0',
            authorityType: 'Withdrawer',
            custodian: CUSTODIAN,
            newAuthorized: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: withoutSysvars(
            getAuthorizeWithSeedInstruction({
                authorityOwner: OWNER,
                authoritySeed: 'stake:0',
                base: signer(BASE),
                lockupAuthority: signer(CUSTODIAN),
                newAuthorizedPubkey: NEW_AUTHORITY,
                stake: STAKE,
                stakeAuthorize: StakeAuthorize.Withdrawer,
            }),
        ),
        name: 'authorizeWithSeed without clockSysvar, custodian at index 2',
        type: 'authorizeWithSeed',
    },
    {
        info: {
            authorized: { staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
            lockup: { custodian: CUSTODIAN, epoch: 400, unixTimestamp: 1_700_000_000 },
            stakeAccount: STAKE,
        },
        ix: withoutSysvars(
            getInitializeInstruction({
                arg0: { staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
                arg1: { custodian: CUSTODIAN, epoch: 400, unixTimestamp: 1_700_000_000 },
                stake: STAKE,
            }),
        ),
        name: 'initialize without rentSysvar',
        type: 'initialize',
    },
    {
        info: { stakeAccount: STAKE, staker: AUTHORITY, withdrawer: NEW_AUTHORITY },
        ix: withoutSysvars(
            getInitializeCheckedInstruction({
                stake: STAKE,
                stakeAuthority: AUTHORITY,
                withdrawAuthority: signer(NEW_AUTHORITY),
            }),
        ),
        name: 'initializeChecked without rentSysvar, staker at index 1',
        type: 'initializeChecked',
    },
    {
        info: {
            authority: AUTHORITY,
            authorityType: 'Staker',
            custodian: CUSTODIAN,
            newAuthority: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: withoutSysvars(
            getAuthorizeCheckedInstruction({
                authority: signer(AUTHORITY),
                lockupAuthority: signer(CUSTODIAN),
                newAuthority: signer(NEW_AUTHORITY),
                stake: STAKE,
                stakeAuthorize: StakeAuthorize.Staker,
            }),
        ),
        name: 'authorizeChecked without clockSysvar, custodian at index 3',
        type: 'authorizeChecked',
    },
    {
        info: {
            authorityBase: BASE,
            authorityOwner: OWNER,
            authoritySeed: 'seed',
            authorityType: 'Withdrawer',
            newAuthorized: NEW_AUTHORITY,
            stakeAccount: STAKE,
        },
        ix: withoutSysvars(
            getAuthorizeCheckedWithSeedInstruction({
                authorityOwner: OWNER,
                authoritySeed: 'seed',
                base: signer(BASE),
                newAuthority: signer(NEW_AUTHORITY),
                stake: STAKE,
                stakeAuthorize: StakeAuthorize.Withdrawer,
            }),
        ),
        name: 'authorizeCheckedWithSeed without clockSysvar, newAuthorized at index 2',
        type: 'authorizeCheckedWithSeed',
    },
];

describe('parseStakeKitInstruction', () => {
    it.each([...CASES, ...CURRENT_LAYOUT_CASES])(
        'should decode $name as Agave parse_stake does',
        ({ ix, type, info }) => {
            expect(parseStakeKitInstruction(toKit(ix))).toEqual({ info, type });
        },
    );

    it('should decode getMinimumDelegation with no info, as Agave parse_stake does', () => {
        const { data } = getGetMinimumDelegationInstruction();
        expect(
            parseStakeKitInstruction({
                accounts: [],
                data: new Uint8Array(data),
                programAddress: STAKE_PROGRAM_ADDRESS,
            }),
        ).toEqual({
            info: undefined,
            type: 'getMinimumDelegation',
        });
    });

    it('should reject the deprecated Redelegate discriminator rather than throw', () => {
        const data = new Uint8Array([15, 0, 0, 0]);
        expect(parseStakeKitInstruction({ accounts: [], data, programAddress: STAKE_PROGRAM_ADDRESS })).toBeUndefined();
    });

    it('should reject an instruction short an account rather than throw', () => {
        const ix = toKit(
            getSplitInstruction({ args: 1n, splitStake: DESTINATION, stake: STAKE, stakeAuthority: signer(AUTHORITY) }),
        );
        expect(parseStakeKitInstruction({ ...ix, accounts: ix.accounts.slice(0, 2) })).toBeUndefined();
    });
});

describe('parseStakeRpcInstruction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(CASES)('should accept the RPC view of $name unchanged', ({ type, info }) => {
        expect(parseStakeRpcInstruction(rpc(type, info))).toEqual({ info, type });
    });

    it('should reject another program silently', () => {
        expect(parseStakeRpcInstruction({ ...rpc('split', {}), program: 'system' })).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should reject an unrecognized type silently', () => {
        expect(parseStakeRpcInstruction(rpc('redelegate', {}))).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should reject and report a payload missing a required field', () => {
        expect(parseStakeRpcInstruction(rpc('split', { stakeAccount: STAKE }))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});

describe('stakeInstructionParser', () => {
    it.each(CASES)(
        'should produce the same envelope from bytes and from the RPC view for $name',
        ({ ix, type, info }) => {
            const fromBytes = dispatcher.fromTransactionInstruction(toLegacy(ix));

            expect(isParsedInstruction(fromBytes)).toBe(true);
            expect(fromBytes).toEqual(dispatcher.fromParsedInstruction(rpc(type, info)));
        },
    );
});

function withoutSysvars(ix: BuiltInstruction): BuiltInstruction {
    const sysvars: string[] = [CLOCK, RENT, STAKE_HISTORY, STAKE_CONFIG];
    return { ...ix, accounts: ix.accounts.filter(meta => !sysvars.includes(meta.address)) };
}

function toKit(ix: BuiltInstruction): KitInstruction {
    return { accounts: [...ix.accounts], data: new Uint8Array(ix.data), programAddress: ix.programAddress };
}

function toLegacy(ix: BuiltInstruction): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(ix.data),
        keys: ix.accounts.map(meta => ({
            isSigner: isSignerRole(meta.role),
            isWritable: isWritableRole(meta.role),
            pubkey: new PublicKey(meta.address),
        })),
        programId: new PublicKey(ix.programAddress),
    });
}

function rpc(type: string, info: unknown): ParsedInstruction {
    return {
        parsed: { info, type },
        program: STAKE_PARSER_LABEL,
        programId: new PublicKey(STAKE_PROGRAM_ADDRESS),
    };
}
