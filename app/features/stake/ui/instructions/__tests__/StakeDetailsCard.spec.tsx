import { address as toAddress } from '@solana/kit';
import type { ParsedInstruction, ParsedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

import { TxInstructionSurface } from '@entities/instruction-card';

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { StakeDetailsCard } from '../StakeDetailsCard';

const A = {
    base: toAddress('BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tZHB'),
    clock: toAddress('SysvarC1ock11111111111111111111111111111111'),
    dest: toAddress('3EbFtRfKRMTrhPrRQjxbfWCB6NUyTQxwsWTKQFVKgNbb'),
    owner: toAddress('6dNUCJLdccKGSSQvQDNvQMKfWiV5j3XSTTGqNsCJ8mSA'),
    source: toAddress('5rATVSqZjaHzMqSJmnbEQNmSJhaKMwsA7Zx2KfBWZBS4'),
    stake: toAddress('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2'),
} as const;

const PROGRAM_ID = new PublicKey(STAKE_PROGRAM_ADDRESS);

const MOVE = { destination: A.dest, lamports: 1_000_000_000, source: A.source, stakeAuthority: A.base };
const WITH_SEED = {
    authorityBase: A.base,
    authorityOwner: A.owner,
    authoritySeed: 'stake:0',
    authorityType: 'Staker',
    newAuthorized: A.dest,
    stakeAccount: A.stake,
};
const LOCKUP = { custodian: A.base, lockup: {}, stakeAccount: A.stake };

/** Pairs share a card shape, so a mis-routed type still renders a plausible card. */
const DISPATCH: Array<{ info: unknown; title: string; type: string }> = [
    { info: MOVE, title: 'Stake Program: Move Stake', type: 'moveStake' },
    { info: MOVE, title: 'Stake Program: Move Lamports', type: 'moveLamports' },
    { info: LOCKUP, title: 'Stake Program: Set Lockup', type: 'setLockup' },
    { info: LOCKUP, title: 'Stake Program: Set Lockup Checked', type: 'setLockupChecked' },
    { info: WITH_SEED, title: 'Stake Program: Authorize With Seed', type: 'authorizeWithSeed' },
    {
        info: { ...WITH_SEED, clockSysvar: A.clock },
        title: 'Stake Program: Authorize Checked With Seed',
        type: 'authorizeCheckedWithSeed',
    },
];

describe('stake::StakeDetailsCard dispatch', () => {
    it.each(DISPATCH)('should render $title for $type', async ({ info, title, type }) => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <TxInstructionSurface result={{ err: null }}>
                                <StakeDetailsCard
                                    tx={{ signatures: ['sig'] } as ParsedTransaction}
                                    ix={
                                        {
                                            parsed: { info, type },
                                            program: 'stake',
                                            programId: PROGRAM_ID,
                                        } as unknown as ParsedInstruction
                                    }
                                    result={{ err: null }}
                                    index={0}
                                />
                            </TxInstructionSurface>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText(title)).toBeInTheDocument();
        });
    });
});
