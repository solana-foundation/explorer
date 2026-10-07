import { gen } from '@__fixtures__/gen';
import type { ParsedInstruction, ParsedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { screen, waitFor } from '@testing-library/react';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { vi } from 'vitest';

import { type CardRow, findCell, readCardRows, renderTxCard } from '@/app/__tests__/card-harness';

import { StakeDetailsCard } from '../StakeDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const A = {
    base: gen.address(1),
    clock: 'SysvarC1ock11111111111111111111111111111111',
    custodian: gen.address(2),
    dest: gen.address(3),
    owner: gen.address(4),
    rent: 'SysvarRent111111111111111111111111111111111',
    source: gen.address(5),
    stake: gen.address(6),
    stakeHistory: 'SysvarStakeHistory1111111111111111111111111',
    system: '11111111111111111111111111111111',
    vote: gen.address(7),
} as const;

const PROGRAM_ID = new PublicKey(STAKE_PROGRAM_ADDRESS);
const PROGRAM: string = STAKE_PROGRAM_ADDRESS;

/** A lockup timestamp and the string the row must derive from it. */
const LOCKUP_TS = 1_700_000_000;
const LOCKUP_TS_TEXT = displayTimestampUtc(unixTimestampToMs(LOCKUP_TS));
const ZERO_TS_TEXT = displayTimestampUtc(unixTimestampToMs(0));

const AUTHORIZE_WITH_SEED = {
    authorityBase: A.base,
    authorityOwner: A.owner,
    authoritySeed: 'stake:0',
    authorityType: 'Staker',
    newAuthorized: A.dest,
    stakeAccount: A.stake,
} as const;

/**
 * `name` labels the it.each case when the card title alone does not say which fixture ran.
 * `mono` names the rows whose value cell sets a monospace font.
 */
const CASES: Array<{ info: object; mono?: string[]; name?: string; rows: CardRow[]; title: string; type: string }> = [
    {
        info: { stakeAccount: A.stake, stakeAuthority: A.base },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Deactivate Stake',
        type: 'deactivate',
    },
    {
        info: { stakeAccount: A.stake, stakeAuthority: A.base, voteAccount: A.vote },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Delegated Vote Address', A.vote],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Delegate Stake',
        type: 'delegate',
    },
    {
        info: { referenceVoteAccount: A.dest, stakeAccount: A.stake, voteAccount: A.vote },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Delinquent Vote Account', A.vote],
            ['Reference Vote Account', A.dest],
        ],
        title: 'Stake Program: Deactivate Delinquent',
        type: 'deactivateDelinquent',
    },
    {
        info: { destination: A.dest, source: A.source, stakeAuthority: A.base },
        name: 'Merge Stake, sysvars omitted',
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Merge Stake',
        type: 'merge',
    },
    {
        info: {
            clockSysvar: A.clock,
            destination: A.dest,
            source: A.source,
            stakeAuthority: A.base,
        },
        name: 'Merge Stake, clock sysvar only',
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
            ['Clock Sysvar', A.clock],
        ],
        title: 'Stake Program: Merge Stake',
        type: 'merge',
    },
    {
        info: {
            clockSysvar: A.clock,
            destination: A.dest,
            source: A.source,
            stakeAuthority: A.base,
            stakeHistorySysvar: A.stakeHistory,
        },
        name: 'Merge Stake, sysvars present',
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
            ['Clock Sysvar', A.clock],
            ['Stake History Sysvar', A.stakeHistory],
        ],
        title: 'Stake Program: Merge Stake',
        type: 'merge',
    },
    {
        info: {
            authority: A.base,
            authorityType: 'Staker',
            newAuthority: A.dest,
            stakeAccount: A.stake,
        },
        name: 'Authorize, no custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Old Authority Address', A.base],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Staker'],
        ],
        title: 'Stake Program: Authorize',
        type: 'authorize',
    },
    {
        info: {
            authority: A.base,
            authorityType: 'Staker',
            custodian: A.custodian,
            newAuthority: A.dest,
            stakeAccount: A.stake,
        },
        name: 'Authorize, with custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Old Authority Address', A.base],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Staker'],
            ['Lockup Custodian', A.custodian],
        ],
        title: 'Stake Program: Authorize',
        type: 'authorize',
    },
    {
        info: {
            authority: A.base,
            authorityType: 'Withdrawer',
            clockSysvar: A.clock,
            newAuthority: A.dest,
            stakeAccount: A.stake,
        },
        name: 'Authorize Checked, no custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Old Authority Address', A.base],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Withdrawer'],
            ['Clock Sysvar', A.clock],
        ],
        title: 'Stake Program: Authorize Checked',
        type: 'authorizeChecked',
    },
    {
        info: {
            authority: A.base,
            authorityType: 'Withdrawer',
            clockSysvar: A.clock,
            custodian: A.custodian,
            newAuthority: A.dest,
            stakeAccount: A.stake,
        },
        name: 'Authorize Checked, with custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Old Authority Address', A.base],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Withdrawer'],
            ['Clock Sysvar', A.clock],
            ['Lockup Custodian', A.custodian],
        ],
        title: 'Stake Program: Authorize Checked',
        type: 'authorizeChecked',
    },
    {
        info: { rentSysvar: A.rent, stakeAccount: A.stake, staker: A.base, withdrawer: A.dest },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Stake Authority Address', A.base],
            ['Withdraw Authority Address', A.dest],
            ['Rent Sysvar', A.rent],
        ],
        title: 'Stake Program: Initialize Checked',
        type: 'initializeChecked',
    },
    {
        info: {
            lamports: 2_500_000_000,
            newSplitAccount: A.dest,
            stakeAccount: A.stake,
            stakeAuthority: A.base,
        },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
            ['New Stake Address', A.dest],
            ['Split Amount (SOL)', '◎2.5'],
        ],
        title: 'Stake Program: Split Stake',
        type: 'split',
    },
    {
        info: {
            destination: A.dest,
            lamports: 1_000_000_000,
            stakeAccount: A.stake,
            withdrawAuthority: A.base,
        },
        name: 'Withdraw Stake, no custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
            ['To Address', A.dest],
            ['Withdraw Amount (SOL)', '◎1'],
        ],
        title: 'Stake Program: Withdraw Stake',
        type: 'withdraw',
    },
    {
        info: {
            custodian: A.custodian,
            destination: A.dest,
            lamports: 1_000_000_000,
            stakeAccount: A.stake,
            withdrawAuthority: A.base,
        },
        name: 'Withdraw Stake, with custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
            ['To Address', A.dest],
            ['Withdraw Amount (SOL)', '◎1'],
            ['Lockup Custodian', A.custodian],
        ],
        title: 'Stake Program: Withdraw Stake',
        type: 'withdraw',
    },
    {
        info: AUTHORIZE_WITH_SEED,
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Base', A.base],
            ['Authority Owner', A.owner],
            ['Authority Seed', 'stake:0'],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Staker'],
        ],
        title: 'Stake Program: Authorize With Seed',
        type: 'authorizeWithSeed',
    },
    {
        info: { ...AUTHORIZE_WITH_SEED, clockSysvar: A.clock, custodian: A.custodian },
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Base', A.base],
            ['Authority Owner', A.owner],
            ['Authority Seed', 'stake:0'],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Staker'],
            ['Clock Sysvar', A.clock],
            ['Lockup Custodian', A.custodian],
        ],
        title: 'Stake Program: Authorize Checked With Seed',
        type: 'authorizeCheckedWithSeed',
    },
    {
        info: {
            destination: A.dest,
            lamports: 5_000_000_000,
            source: A.source,
            stakeAuthority: A.base,
        },
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
            ['Move Amount (SOL)', '◎5'],
        ],
        title: 'Stake Program: Move Stake',
        type: 'moveStake',
    },
    {
        info: {
            destination: A.dest,
            lamports: 5_000_000_000,
            source: A.source,
            stakeAuthority: A.base,
        },
        rows: [
            ['Program', PROGRAM],
            ['Source', A.source],
            ['Destination', A.dest],
            ['Authority Address', A.base],
            ['Move Amount (SOL)', '◎5'],
        ],
        title: 'Stake Program: Move Lamports',
        type: 'moveLamports',
    },
    {
        info: { custodian: A.custodian, lockup: {}, stakeAccount: A.stake },
        name: 'Set Lockup, no lockup args',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Lockup Authority', A.custodian],
        ],
        title: 'Stake Program: Set Lockup',
        type: 'setLockup',
    },
    {
        // `SetLockup` guards on `!== undefined`, so an explicit zero still earns its row.
        info: { custodian: A.custodian, lockup: { epoch: 0, unixTimestamp: 0 }, stakeAccount: A.stake },
        name: 'Set Lockup, zero epoch and timestamp',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Lockup Authority', A.custodian],
            ['New Lockup Expiry Epoch', '0'],
            ['New Lockup Expiry Timestamp', ZERO_TS_TEXT],
        ],
        title: 'Stake Program: Set Lockup',
        type: 'setLockup',
    },
    {
        info: {
            custodian: A.custodian,
            lockup: { custodian: A.dest, epoch: 500, unixTimestamp: LOCKUP_TS },
            stakeAccount: A.stake,
        },
        mono: ['New Lockup Expiry Timestamp'],
        name: 'Set Lockup Checked, all lockup args',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Lockup Authority', A.custodian],
            ['New Lockup Expiry Epoch', '500'],
            ['New Lockup Expiry Timestamp', LOCKUP_TS_TEXT],
            ['New Lockup Custodian', A.dest],
        ],
        title: 'Stake Program: Set Lockup Checked',
        type: 'setLockupChecked',
    },
    {
        info: {
            authorized: { staker: A.base, withdrawer: A.dest },
            lockup: { custodian: A.custodian, epoch: 300, unixTimestamp: LOCKUP_TS },
            rentSysvar: A.rent,
            stakeAccount: A.stake,
        },
        name: 'Initialize Stake, with lockup',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Stake Authority Address', A.base],
            ['Withdraw Authority Address', A.dest],
            ['Lockup Expiry Epoch', '300'],
            ['Lockup Expiry Timestamp', LOCKUP_TS_TEXT],
            ['Lockup Custodian Address', A.custodian],
            ['Rent Sysvar', A.rent],
        ],
        title: 'Stake Program: Initialize Stake',
        type: 'initialize',
    },
    {
        // `Initialize` guards on `> 0`, so an unset expiry drops both rows but keeps the custodian.
        info: {
            authorized: { staker: A.base, withdrawer: A.dest },
            lockup: { custodian: A.custodian, epoch: 0, unixTimestamp: 0 },
            rentSysvar: A.rent,
            stakeAccount: A.stake,
        },
        name: 'Initialize Stake, zero lockup expiry',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Stake Authority Address', A.base],
            ['Withdraw Authority Address', A.dest],
            ['Lockup Custodian Address', A.custodian],
            ['Rent Sysvar', A.rent],
        ],
        title: 'Stake Program: Initialize Stake',
        type: 'initialize',
    },
    {
        info: {
            authorized: { staker: A.base, withdrawer: A.dest },
            lockup: { custodian: A.system, epoch: 300, unixTimestamp: LOCKUP_TS },
            rentSysvar: A.rent,
            stakeAccount: A.stake,
        },
        name: 'Initialize Stake, system-program custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Stake Authority Address', A.base],
            ['Withdraw Authority Address', A.dest],
            ['Lockup Expiry Epoch', '300'],
            ['Lockup Expiry Timestamp', LOCKUP_TS_TEXT],
            ['Rent Sysvar', A.rent],
        ],
        title: 'Stake Program: Initialize Stake',
        type: 'initialize',
    },
    {
        info: {},
        rows: [['Program', PROGRAM]],
        title: 'Stake Program: Get Minimum Delegation',
        type: 'getMinimumDelegation',
    },
];

describe('stake::instruction cards', () => {
    /** Pins each card's rows: label, order, count, and the value every row resolves to. */
    it.each(CASES.map(c => ({ ...c, name: c.name ?? c.title })))(
        'should render the rows of $name',
        async ({ info, mono = [], rows, title, type }) => {
            renderCard({ info, type });

            // The cluster provider finishes an async fetch after mount, so assert inside waitFor.
            await waitFor(() => {
                expect(readCardRows()).toEqual(rows);
            });

            expect(screen.getByText(title)).toBeInTheDocument();
            mono.forEach(label => expect(findCell(label)).toHaveClass('font-mono'));
        },
    );

    // A foreign program id proves the row reads the instruction rather than a stake-program constant.
    it('should render the program row from the instruction', async () => {
        renderCard(
            { info: { stakeAccount: A.stake, stakeAuthority: A.base }, type: 'deactivate' },
            new PublicKey(A.vote),
        );

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', A.vote]);
        });
    });

    it('should render the authority seed as copyable code', async () => {
        renderCard({ info: AUTHORIZE_WITH_SEED, type: 'authorizeWithSeed' });

        await waitFor(() => {
            expect(screen.getByText('stake:0').tagName).toBe('CODE');
        });
    });
});

function renderCard(parsed: { info: object; type: string }, programId = PROGRAM_ID) {
    const ix = { parsed, program: 'stake', programId } as unknown as ParsedInstruction;

    return renderTxCard(
        <StakeDetailsCard tx={{ signatures: ['sig'] } as ParsedTransaction} ix={ix} result={{ err: null }} index={0} />,
    );
}
