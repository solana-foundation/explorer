import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import type { Account } from '@/app/providers/accounts';
import { Cluster } from '@/app/utils/cluster';

import { UnknownAccountCard } from '../UnknownAccountCard';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: Cluster.MainnetBeta,
        url: 'https://api.mainnet-beta.solana.com',
    })),
}));

// The cross-cluster probe fires real RPC requests — stub it out so these tests stay
// offline. The probe UI itself is covered by the cluster entity's own spec.
vi.mock('@entities/cluster', () => ({
    AdjacentClusterLink: () => null,
    SearchingClusterIndicator: () => null,
    useClusterResourceSearch: vi.fn(() => ({
        foundCluster: undefined,
        searchingCluster: undefined,
        status: 'not-found',
    })),
}));

vi.mock('@features/account', () => ({
    AccountCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function makeAccount(lamports: number): Account {
    return {
        data: {},
        executable: false,
        lamports,
        owner: PublicKey.default,
        pubkey: new PublicKey('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2'),
        space: 0,
    } as unknown as Account;
}

describe('UnknownAccountCard balance', () => {
    // A zero-lamport account still has a balance to show: replacing it with
    // "Account does not exist" hides the 0 SOL the issue asks to display.
    it('should show a zero SOL balance for an account with no lamports', () => {
        render(<UnknownAccountCard account={makeAccount(0)} />);

        expect(screen.getByText('◎0')).toBeInTheDocument();
    });

    it('should keep the not-found notice alongside the zero balance', () => {
        render(<UnknownAccountCard account={makeAccount(0)} />);

        expect(screen.getByText('◎0')).toBeInTheDocument();
        expect(screen.getByText('Account does not exist')).toBeInTheDocument();
    });

    it('should show only the balance for a funded account', () => {
        render(<UnknownAccountCard account={makeAccount(1_000_000_000)} />);

        expect(screen.getByText('◎1')).toBeInTheDocument();
        expect(screen.queryByText('Account does not exist')).not.toBeInTheDocument();
    });
});
