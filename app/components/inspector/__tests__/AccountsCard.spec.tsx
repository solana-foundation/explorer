/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { AccountsCard } from '../AccountsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

describe('inspector::AccountsCard', () => {
    test.each([
        { message: mock.deserializeMessage(stubs.systemTransferMsg), name: 'message without lookup tables' },
        { message: mock.deserializeMessageV0(stubs.tokenTransferMsg), name: 'versioned message' },
    ])('should render accounts from $name', async ({ message }) => {
        renderWithProviders(<AccountsCard message={message} />, { transactions: false });

        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Account List/)).toBeInTheDocument();
            // The fee payer (account index 0) carries a Signer badge — rendered from the message header,
            // independent of on-chain account loading. Both the mobile card and desktop row emit it.
            expect(screen.getAllByText('Signer').length).toBeGreaterThan(0);
        });
        // No simulation is wired up here, so the hint under the heading says why the Change column is empty.
        expect(screen.getByText(/Simulate to see balance changes/, { selector: 'p' })).toBeInTheDocument();
    });
});
