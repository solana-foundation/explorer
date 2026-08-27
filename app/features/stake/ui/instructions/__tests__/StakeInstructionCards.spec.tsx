import { type InstructionNode, TxInstructionSurface } from '@entities/instruction-card';
import { address as toAddress } from '@solana/kit';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { render, screen, waitFor, within } from '@testing-library/react';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { AuthorizeCheckedDetailsCard } from '../AuthorizeCheckedDetailsCard';
import { AuthorizeDetailsCard } from '../AuthorizeDetailsCard';
import { AuthorizeCheckedWithSeedDetailsCard, AuthorizeWithSeedDetailsCard } from '../AuthorizeWithSeedDetailsCard';
import { DeactivateDelinquentDetailsCard } from '../DeactivateDelinquentDetailsCard';
import { DeactivateDetailsCard } from '../DeactivateDetailsCard';
import { DelegateDetailsCard } from '../DelegateDetailsCard';
import { GetMinimumDelegationDetailsCard } from '../GetMinimumDelegationDetailsCard';
import { InitializeCheckedDetailsCard } from '../InitializeCheckedDetailsCard';
import { InitializeDetailsCard } from '../InitializeDetailsCard';
import { MergeDetailsCard } from '../MergeDetailsCard';
import { MoveLamportsDetailsCard, MoveStakeDetailsCard } from '../MoveDetailsCard';
import { SetLockupCheckedDetailsCard, SetLockupDetailsCard } from '../SetLockupDetailsCard';
import { SplitDetailsCard } from '../SplitDetailsCard';
import { WithdrawDetailsCard } from '../WithdrawDetailsCard';

const A = {
    base: toAddress('BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tZHB'),
    clock: toAddress('SysvarC1ock11111111111111111111111111111111'),
    custodian: toAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'),
    dest: toAddress('3EbFtRfKRMTrhPrRQjxbfWCB6NUyTQxwsWTKQFVKgNbb'),
    owner: toAddress('6dNUCJLdccKGSSQvQDNvQMKfWiV5j3XSTTGqNsCJ8mSA'),
    rent: toAddress('SysvarRent111111111111111111111111111111111'),
    source: toAddress('5rATVSqZjaHzMqSJmnbEQNmSJhaKMwsA7Zx2KfBWZBS4'),
    stake: toAddress('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2'),
    stakeHistory: toAddress('SysvarStakeHistory1111111111111111111111111'),
    system: toAddress('11111111111111111111111111111111'),
    vote: toAddress('4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp'),
} as const;

const PROGRAM_ID = new PublicKey(STAKE_PROGRAM_ADDRESS);
const PROGRAM: string = STAKE_PROGRAM_ADDRESS;

/** A lockup timestamp and the string the row must derive from it. */
const LOCKUP_TS = 1_700_000_000;
const LOCKUP_TS_TEXT = displayTimestampUtc(unixTimestampToMs(LOCKUP_TS));
const ZERO_TS_TEXT = displayTimestampUtc(unixTimestampToMs(0));

const node: InstructionNode = {
    index: 0,
    // The shell only reads `ix` for the Raw view, which these cards never open.
    ix: { parsed: {}, program: 'stake', programId: PROGRAM_ID } as unknown as ParsedInstruction,
    programId: PROGRAM_ID,
};

const AUTHORIZE_WITH_SEED = {
    authorityBase: A.base,
    authorityOwner: A.owner,
    authoritySeed: 'stake:0',
    authorityType: 'Staker',
    newAuthorized: A.dest,
    stakeAccount: A.stake,
} as const;

/** Each row as `[label, value]`. An address row carries the untruncated address, not the shortened text. */
type Row = [string, string];

/** `name` labels the it.each case when the card title alone does not say which fixture ran. */
const CASES: Array<{ card: React.ReactElement; rows: Row[]; name?: string; title: string }> = [
    {
        card: <DeactivateDetailsCard node={node} info={{ stakeAccount: A.stake, stakeAuthority: A.base }} />,
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Deactivate Stake',
    },
    {
        card: (
            <DelegateDetailsCard
                node={node}
                info={{ stakeAccount: A.stake, stakeAuthority: A.base, voteAccount: A.vote }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Delegated Vote Address', A.vote],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Delegate Stake',
    },
    {
        card: (
            <DeactivateDelinquentDetailsCard
                node={node}
                info={{ referenceVoteAccount: A.dest, stakeAccount: A.stake, voteAccount: A.vote }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Delinquent Vote Account', A.vote],
            ['Reference Vote Account', A.dest],
        ],
        title: 'Stake Program: Deactivate Delinquent',
    },
    {
        card: <MergeDetailsCard node={node} info={{ destination: A.dest, source: A.source, stakeAuthority: A.base }} />,
        name: 'Merge Stake, sysvars omitted',
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
        ],
        title: 'Stake Program: Merge Stake',
    },
    {
        card: (
            <MergeDetailsCard
                node={node}
                info={{
                    clockSysvar: A.clock,
                    destination: A.dest,
                    source: A.source,
                    stakeAuthority: A.base,
                }}
            />
        ),
        name: 'Merge Stake, clock sysvar only',
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
            ['Clock Sysvar', A.clock],
        ],
        title: 'Stake Program: Merge Stake',
    },
    {
        card: (
            <MergeDetailsCard
                node={node}
                info={{
                    clockSysvar: A.clock,
                    destination: A.dest,
                    source: A.source,
                    stakeAuthority: A.base,
                    stakeHistorySysvar: A.stakeHistory,
                }}
            />
        ),
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
    },
    {
        card: (
            <AuthorizeDetailsCard
                node={node}
                info={{
                    authority: A.base,
                    authorityType: 'Staker',
                    newAuthority: A.dest,
                    stakeAccount: A.stake,
                }}
            />
        ),
        name: 'Authorize, no custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Old Authority Address', A.base],
            ['New Authority Address', A.dest],
            ['Authority Type', 'Staker'],
        ],
        title: 'Stake Program: Authorize',
    },
    {
        card: (
            <AuthorizeDetailsCard
                node={node}
                info={{
                    authority: A.base,
                    authorityType: 'Staker',
                    custodian: A.custodian,
                    newAuthority: A.dest,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: (
            <AuthorizeCheckedDetailsCard
                node={node}
                info={{
                    authority: A.base,
                    authorityType: 'Withdrawer',
                    clockSysvar: A.clock,
                    newAuthority: A.dest,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: (
            <AuthorizeCheckedDetailsCard
                node={node}
                info={{
                    authority: A.base,
                    authorityType: 'Withdrawer',
                    clockSysvar: A.clock,
                    custodian: A.custodian,
                    newAuthority: A.dest,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: (
            <InitializeCheckedDetailsCard
                node={node}
                info={{ rentSysvar: A.rent, stakeAccount: A.stake, staker: A.base, withdrawer: A.dest }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Stake Authority Address', A.base],
            ['Withdraw Authority Address', A.dest],
            ['Rent Sysvar', A.rent],
        ],
        title: 'Stake Program: Initialize Checked',
    },
    {
        card: (
            <SplitDetailsCard
                node={node}
                info={{
                    lamports: 2_000_000_000,
                    newSplitAccount: A.dest,
                    stakeAccount: A.stake,
                    stakeAuthority: A.base,
                }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
            ['New Stake Address', A.dest],
            ['Split Amount (SOL)', '◎2'],
        ],
        title: 'Stake Program: Split Stake',
    },
    {
        card: (
            <WithdrawDetailsCard
                node={node}
                info={{
                    destination: A.dest,
                    lamports: 1_000_000_000,
                    stakeAccount: A.stake,
                    withdrawAuthority: A.base,
                }}
            />
        ),
        name: 'Withdraw Stake, no custodian',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Authority Address', A.base],
            ['To Address', A.dest],
            ['Withdraw Amount (SOL)', '◎1'],
        ],
        title: 'Stake Program: Withdraw Stake',
    },
    {
        card: (
            <WithdrawDetailsCard
                node={node}
                info={{
                    custodian: A.custodian,
                    destination: A.dest,
                    lamports: 1_000_000_000,
                    stakeAccount: A.stake,
                    withdrawAuthority: A.base,
                }}
            />
        ),
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
    },
    {
        card: <AuthorizeWithSeedDetailsCard node={node} info={AUTHORIZE_WITH_SEED} />,
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
    },
    {
        card: (
            <AuthorizeCheckedWithSeedDetailsCard
                node={node}
                info={{ ...AUTHORIZE_WITH_SEED, clockSysvar: A.clock, custodian: A.custodian }}
            />
        ),
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
    },
    {
        card: (
            <MoveStakeDetailsCard
                node={node}
                info={{
                    destination: A.dest,
                    lamports: 5_000_000_000,
                    source: A.source,
                    stakeAuthority: A.base,
                }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Stake Source', A.source],
            ['Stake Destination', A.dest],
            ['Authority Address', A.base],
            ['Move Amount (SOL)', '◎5'],
        ],
        title: 'Stake Program: Move Stake',
    },
    {
        card: (
            <MoveLamportsDetailsCard
                node={node}
                info={{
                    destination: A.dest,
                    lamports: 5_000_000_000,
                    source: A.source,
                    stakeAuthority: A.base,
                }}
            />
        ),
        rows: [
            ['Program', PROGRAM],
            ['Source', A.source],
            ['Destination', A.dest],
            ['Authority Address', A.base],
            ['Move Amount (SOL)', '◎5'],
        ],
        title: 'Stake Program: Move Lamports',
    },
    {
        card: <SetLockupDetailsCard node={node} info={{ custodian: A.custodian, lockup: {}, stakeAccount: A.stake }} />,
        name: 'Set Lockup, no lockup args',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Lockup Authority', A.custodian],
        ],
        title: 'Stake Program: Set Lockup',
    },
    {
        // `SetLockup` guards on `!== undefined`, so an explicit zero still earns its row.
        card: (
            <SetLockupDetailsCard
                node={node}
                info={{ custodian: A.custodian, lockup: { epoch: 0, unixTimestamp: 0 }, stakeAccount: A.stake }}
            />
        ),
        name: 'Set Lockup, zero epoch and timestamp',
        rows: [
            ['Program', PROGRAM],
            ['Stake Address', A.stake],
            ['Lockup Authority', A.custodian],
            ['New Lockup Expiry Epoch', '0'],
            ['New Lockup Expiry Timestamp', ZERO_TS_TEXT],
        ],
        title: 'Stake Program: Set Lockup',
    },
    {
        card: (
            <SetLockupCheckedDetailsCard
                node={node}
                info={{
                    custodian: A.custodian,
                    lockup: { custodian: A.dest, epoch: 500, unixTimestamp: LOCKUP_TS },
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: (
            <InitializeDetailsCard
                node={node}
                info={{
                    authorized: { staker: A.base, withdrawer: A.dest },
                    lockup: { custodian: A.custodian, epoch: 300, unixTimestamp: LOCKUP_TS },
                    rentSysvar: A.rent,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        // `Initialize` guards on `> 0`, so an unset expiry drops both rows but keeps the custodian.
        card: (
            <InitializeDetailsCard
                node={node}
                info={{
                    authorized: { staker: A.base, withdrawer: A.dest },
                    lockup: { custodian: A.custodian, epoch: 0, unixTimestamp: 0 },
                    rentSysvar: A.rent,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: (
            <InitializeDetailsCard
                node={node}
                info={{
                    authorized: { staker: A.base, withdrawer: A.dest },
                    lockup: { custodian: A.system, epoch: 300, unixTimestamp: LOCKUP_TS },
                    rentSysvar: A.rent,
                    stakeAccount: A.stake,
                }}
            />
        ),
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
    },
    {
        card: <GetMinimumDelegationDetailsCard node={node} />,
        rows: [['Program', PROGRAM]],
        title: 'Stake Program: Get Minimum Delegation',
    },
];

describe('stake::instruction cards', () => {
    /** Pins each card's rows: label, order, count, and the value every row resolves to. */
    it.each(CASES.map(c => ({ ...c, name: c.name ?? c.title })))(
        'should render the rows of $name',
        async ({ card, rows, title }) => {
            renderCard(card);

            // The cluster provider finishes an async fetch after mount, so assert inside waitFor.
            await waitFor(() => {
                expect(readRows()).toEqual(rows);
            });

            expect(screen.getByText(title)).toBeInTheDocument();
        },
    );

    it('should render lamport amounts as SOL', async () => {
        renderCard(
            <SplitDetailsCard
                node={node}
                info={{
                    lamports: 2_500_000_000,
                    newSplitAccount: A.dest,
                    stakeAccount: A.stake,
                    stakeAuthority: A.base,
                }}
            />,
        );

        await waitFor(() => {
            expect(readCell('Split Amount (SOL)')).toContain('2.5');
        });
    });

    it('should render the authority type verbatim', async () => {
        renderCard(
            <AuthorizeDetailsCard
                node={node}
                info={{
                    authority: A.base,
                    authorityType: 'Withdrawer',
                    newAuthority: A.dest,
                    stakeAccount: A.stake,
                }}
            />,
        );

        await waitFor(() => {
            expect(readCell('Authority Type')).toBe('Withdrawer');
        });
    });

    it('should render the lockup epoch and the timestamp converted to UTC', async () => {
        renderCard(
            <SetLockupCheckedDetailsCard
                node={node}
                info={{
                    custodian: A.custodian,
                    lockup: { epoch: 500, unixTimestamp: LOCKUP_TS },
                    stakeAccount: A.stake,
                }}
            />,
        );

        await waitFor(() => {
            expect(readCell('New Lockup Expiry Epoch')).toContain('500');
        });
        expect(readCell('New Lockup Expiry Timestamp')).toBe(LOCKUP_TS_TEXT);
        expect(findCell('New Lockup Expiry Timestamp')).toHaveClass('font-mono');
    });

    // A foreign program id proves the row reads the node rather than a stake-program constant.
    it('should render the program row from the node', async () => {
        renderCard(
            <DeactivateDetailsCard
                node={{ ...node, programId: new PublicKey(A.vote) }}
                info={{ stakeAccount: A.stake, stakeAuthority: A.base }}
            />,
        );

        await waitFor(() => {
            expect(readRows()[0]).toEqual(['Program', A.vote]);
        });
    });

    it('should render the authority seed as copyable code', async () => {
        renderCard(<AuthorizeWithSeedDetailsCard node={node} info={AUTHORIZE_WITH_SEED} />);

        await waitFor(() => {
            expect(screen.getByText('stake:0').tagName).toBe('CODE');
        });
    });
});

function renderCard(card: React.ReactElement) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>{card}</TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

/**
 * In render order, so the result pins row order as well as content. Addresses are read
 * from `data-address`, which carries the untruncated value the display shortens; every
 * other kind falls back to its rendered text, so a wrong value fails rather than reading
 * as an empty cell.
 */
function readRows(): Row[] {
    return screen.getAllByRole('row').map(row => {
        const cells = within(row).getAllByRole('cell');
        // eslint-disable-next-line testing-library/no-node-access -- an address has no role to query by
        const address = cells[1]?.querySelector('[data-address]')?.getAttribute('data-address');
        return [cells[0].textContent ?? '', address ?? cells[1]?.textContent ?? ''];
    });
}

function findCell(label: string): HTMLElement | undefined {
    const row = screen.getAllByRole('row').find(r => within(r).getAllByRole('cell')[0]?.textContent === label);
    return row && within(row).getAllByRole('cell')[1];
}

function readCell(label: string): string {
    return findCell(label)?.textContent ?? '';
}
