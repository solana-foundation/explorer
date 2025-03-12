import { AccountInfo } from '@solana/web3.js';
import { generated, PROGRAM_ID } from '@sqds/multisig';
const { VaultTransaction } = generated;
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';

import { TransactionInspectorPage } from '../InspectorPage';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

// Create mocks for the required dependencies
const mockUseSearchParams = () => {
    const params = new URLSearchParams();
    params.set('squadsTx', 'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf');
    return params;
};

const MOCK_SQUADS_ACCOUNT_INFO: AccountInfo<Buffer> = {
    data: Buffer.from(
        'qPqiZFEOos+fErS/xkrbJRCvXG3UbwrUsJlVxCt0e4xgzjQyewfzMULyaPFkYPsCiNMe9FN//udpL5PwKAM/1qdskrvY+9nLCAAAAAAAAAD/AP8AAAAAAQEECAAAANCjHLRKvgiq2AoZK5QSGOfYj5bTGybeyAspA1+XDrVyM90v0fImaE0NQYcSinPuk++6GJEe5cKJZ4w9p0mAYgkJKhPulcQcugimf1rGfo334doRYl4dZBN/j08jgwN/FDCuVi3sTsjyvqU+oP8oI/e92Q78flUtkwuKGo3ug/s7V4efG9ifzqH+b9ldMvB714n0oZVW1d6xudyfhcoWP+0CqPaRToihsOIQFT73Y64rAMK5PRbBJNLAU3oQBIAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAABAAAABQcAAAABAgMEBgcABAAAAAMAAAAAAAAA',
        'base64'
    ),
    executable: false,
    lamports: 1000000,
    owner: PROGRAM_ID,
};

// Mock SWR
vi.mock('swr', () => ({
    __esModule: true,
    default: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(),
    useRouter: vi.fn(),
    usePathname: vi.fn(),
}));

// Simple test to verify our mocks
describe('TransactionInspectorPage with Squads Transaction', () => {
    test('renders without crashing and loads Squads account data', async () => {
        // Override the useSearchParams mock for this specific test
        const mockUseSearchParamsReturn = mockUseSearchParams();
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        // Mock the router
        const mockRouter = { push: vi.fn(), replace: vi.fn() };
        vi.spyOn(await import('next/navigation'), 'useRouter').mockReturnValue(mockRouter as any);

        // Setup specific SWR response for Squads account data
        const specificAccountKey = [
            'squads-proposal',
            'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf',
            'https://api.mainnet-beta.solana.com',
        ];

        const mockSWR = await import('swr');
        (mockSWR.default as any).mockImplementation((key: any) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    data: VaultTransaction.fromAccountInfo(MOCK_SQUADS_ACCOUNT_INFO)[0],
                    error: null,
                    isLoading: false,
                };
            }
            return { data: null, error: null, isLoading: true };
        });

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TransactionInspectorPage showTokenBalanceChanges={false} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        // Initially it should show loading
        expect(screen.getByText(/Loading proposal data/i)).not.toBeNull();
        await waitFor(() => {
            expect(screen.queryByText(/Loading proposal data/i)).toBeNull();
        });
        // Check that the td with text Fee Payer has the text F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT
        const feePayerRow = screen.getByText(/Fee Payer/i).closest('tr');
        expect(feePayerRow).not.toBeNull();
        expect(feePayerRow?.textContent).toContain('F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT');

        expect(screen.getByText(/Account List \(8\)/i)).not.toBeNull();
        expect(screen.getByText(/BPF Upgradeable Loader Instruction/i)).not.toBeNull();
    });

    // test('shows error when account loading fails', async () => {
    //     // Override the SWR mock for this specific test
    //     vi.mock('swr', () => ({
    //         __esModule: true,
    //         default: () => ({
    //             data: null,
    //             error: new Error('Failed to load account'),
    //             isLoading: false,
    //         }),
    //     }));

    //     const onClearMock = vi.fn();

    //     render(<SquadsProposalInspectorCard account="InvalidAccount" onClear={onClearMock} />);

    //     await waitFor(() => {
    //         expect(screen.getByText(/Error loading vault transaction/i)).toBeInTheDocument();
    //         expect(screen.getByText(/Clear/i)).toBeInTheDocument();
    //     });
    // });
});
