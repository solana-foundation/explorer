import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import BN from 'bn.js';
import React from 'react';
import { vi } from 'vitest';

import type { SolBalanceChange } from '../../lib/types';
import { SolBalanceChangesCard } from '../SolBalanceChangesCard';

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

vi.mock('@components/common/BalanceDelta', () => ({
    BalanceDelta: ({ delta, isSol }: { delta: BN; isSol: boolean }) => (
        <div data-testid="balance-delta">
            {delta.toString()} {isSol ? 'SOL' : ''}
        </div>
    ),
}));

vi.mock('@components/common/SolBalance', () => ({
    SolBalance: ({ lamports }: { lamports: number | bigint }) => (
        <div data-testid="sol-balance">{lamports.toString()}</div>
    ),
}));

describe('SolBalanceChangesCard', () => {
    function createMockBalanceChange(
        pubkeyString: string,
        delta: string,
        preBalance: string,
        postBalance: string
    ): SolBalanceChange {
        return {
            delta: new BN(delta),
            postBalance: new BN(postBalance),
            preBalance: new BN(preBalance),
            pubkey: new PublicKey(pubkeyString),
        };
    }

    it('should render card with title', () => {
        const balanceChanges: SolBalanceChange[] = [];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.getByText('SOL Balance Changes')).toBeInTheDocument();
    });

    it('should render table headers', () => {
        const balanceChanges: SolBalanceChange[] = [];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.getByText('#')).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Change (SOL)')).toBeInTheDocument();
        expect(screen.getByText('Post Balance (SOL)')).toBeInTheDocument();
    });

    it('should render single balance change', () => {
        const mockPubkey = 'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS';
        const balanceChanges: SolBalanceChange[] = [
            createMockBalanceChange(mockPubkey, '1000000000', '2000000000', '3000000000'),
        ];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.getByTestId('address')).toHaveTextContent(mockPubkey);
        expect(screen.getByTestId('balance-delta')).toHaveTextContent('1000000000');
        expect(screen.getByTestId('sol-balance')).toHaveTextContent('3000000000');
    });

    it('should render multiple balance changes with correct numbering', () => {
        const balanceChanges: SolBalanceChange[] = [
            createMockBalanceChange(
                'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
                '1000000000',
                '2000000000',
                '3000000000'
            ),
            createMockBalanceChange(
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '2000000000',
                '3000000000',
                '5000000000'
            ),
            createMockBalanceChange('11111111111111111111111111111111', '-500000000', '1000000000', '500000000'),
        ];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        const addresses = screen.getAllByTestId('address');
        expect(addresses).toHaveLength(3);
        expect(addresses[0]).toHaveTextContent('GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS');
        expect(addresses[1]).toHaveTextContent('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        expect(addresses[2]).toHaveTextContent('11111111111111111111111111111111');
    });

    it('should render with negative delta', () => {
        const balanceChanges: SolBalanceChange[] = [
            createMockBalanceChange(
                'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
                '-1000000000',
                '2000000000',
                '1000000000'
            ),
        ];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.getByTestId('balance-delta')).toHaveTextContent('-1000000000');
        expect(screen.getByTestId('sol-balance')).toHaveTextContent('1000000000');
    });

    it('should render empty table when no balance changes', () => {
        const balanceChanges: SolBalanceChange[] = [];

        render(<SolBalanceChangesCard balanceChanges={balanceChanges} />);

        expect(screen.queryByTestId('address')).not.toBeInTheDocument();
        expect(screen.queryByTestId('balance-delta')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sol-balance')).not.toBeInTheDocument();
    });
});
