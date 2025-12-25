import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation');

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';

import { AccountsCard } from '../AccountsCard';

describe('inspector::AccountsCard', () => {
    test('should render accounts from message without lookup tables', async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        render(
            <ClusterProvider>
                <AccountsProvider>
                    <AccountsCard message={m} />
                </AccountsProvider>
            </ClusterProvider>
        );

        // Should show account list header
        expect(screen.getByText(/Account List/)).toBeInTheDocument();

        // Should show account rows
        expect(screen.getByText('Account #1')).toBeInTheDocument();
    });

    test('should render accounts from versioned message', async () => {
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);

        render(
            <ClusterProvider>
                <AccountsProvider>
                    <AccountsCard message={m} />
                </AccountsProvider>
            </ClusterProvider>
        );

        // Should show account list header
        expect(screen.getByText(/Account List/)).toBeInTheDocument();

        // Should show account rows
        expect(screen.getByText('Account #1')).toBeInTheDocument();
    });
});
