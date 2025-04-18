import { AccountInfo } from '@solana/web3.js';
import { generated, PROGRAM_ID } from '@sqds/multisig';
const { VaultTransaction } = generated;
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import { sleep } from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { TransactionInspectorPage } from '../InspectorPage';

// Create mocks for the required dependencies
const mockUseSearchParams = () => {
    const params = new URLSearchParams();
    // Normal Squads transaction
    params.set('squadsTx', 'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf');
    // Squads transaction with lookup table
    return params;
};

// From Squads transaction ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf'
const MOCK_SQUADS_ACCOUNT_INFO: AccountInfo<Buffer> = {
    data: Buffer.from(
        'qPqiZFEOos+fErS/xkrbJRCvXG3UbwrUsJlVxCt0e4xgzjQyewfzMULyaPFkYPsCiNMe9FN//udpL5PwKAM/1qdskrvY+9nLCAAAAAAAAAD/AP8AAAAAAQEECAAAANCjHLRKvgiq2AoZK5QSGOfYj5bTGybeyAspA1+XDrVyM90v0fImaE0NQYcSinPuk++6GJEe5cKJZ4w9p0mAYgkJKhPulcQcugimf1rGfo334doRYl4dZBN/j08jgwN/FDCuVi3sTsjyvqU+oP8oI/e92Q78flUtkwuKGo3ug/s7V4efG9ifzqH+b9ldMvB714n0oZVW1d6xudyfhcoWP+0CqPaRToihsOIQFT73Y64rAMK5PRbBJNLAU3oQBIAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAABAAAABQcAAAABAgMEBgcABAAAAAMAAAAAAAAA',
        'base64'
    ),
    executable: false,
    lamports: 1000000,
    owner: PROGRAM_ID,
};

// From Squads transaction D6zTKhuJdvU4aPcgnJrXhaL3AP54AGQKVaiQkikH7fwH
const MOCK_SQUADS_LOOKUP_TABLE_ACCOUNT_INFO: AccountInfo<Buffer> = {
    data: Buffer.from(
        'qPqiZFEOos8bpNmzOFnIgq7HtFDkjs0zoH+RjHiREtlTMLrrxCnOoOcFvY3L4K/GkofeZWEMwteLWwiE+IC8lnd8Ck5flvyb3QQAAAAAAAD+AP8AAAAAAQEFBgAAAEq4mP2n8jYC4uvQ/2riMoE0PhxgqIF66HAqkgBn4/7YWvNmtUiOi7IxoG9Yg+DNwzaHxoGjbIgVzFpOmwEZBmf9dPjWz8/N7PpjzVI1TulkO4Egf8ZYe7WLo0OjhhrzoYQzUnBMSyxrGPE/4v6Xp81WeB65mgEPCx6Nm2doqmmMmJEqbWg9L9Do0t/Tr7QiU2rSPiAV6W0bNxo4qIu+aRNLpsNxnQkq2EAyNB4e5Vx8/7kaTXVN+Y+DEOMrcIenQgEAAAAGCgAAAAABAgMEBQcICQowAAAA9r57/qtrEp4AZc0dAAAAAL9A3h92lHzal8AhXk0xQ6drSpPcsjemGX1gSwpnAfeuAQAAAC2j9Rh4Ufp3UyACH6zJgVGpNk7XhltxlBh5LvHTkFE+AAAAAAUAAAA4LwgHBQ==',
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
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Simple test to verify our mocks
describe('TransactionInspectorPage with Squads Transaction', () => {
    const specificAccountKey = [
        'squads-proposal',
        'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf',
        'https://api.mainnet-beta.solana.com',
    ];

    beforeEach(async () => {
        // sleep to allow not facing 429s
        await sleep();

        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams();
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        // Setup router mock
        const mockRouter = { push: vi.fn(), replace: vi.fn() };
        vi.spyOn(await import('next/navigation'), 'useRouter').mockReturnValue(mockRouter as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders without crashing and loads Squads account data', async () => {
        // Setup SWR mock for successful response
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

        await waitFor(
            () => {
                expect(screen.queryByText(/Inspector Input/i)).toBeNull();
            },
            { interval: 50, timeout: 10000 }
        );

        // Check that the td with text Fee Payer has the text F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT
        expect(screen.getByRole('row', { name: /Fee Payer/i })).toHaveTextContent(
            'F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT'
        );

        expect(screen.getByText(/Account List \(8\)/i)).not.toBeNull();
        expect(screen.getByText(/BPF Upgradeable Loader Instruction/i)).not.toBeNull();
    });

    test('still renders when account loading fails', async () => {
        // Setup SWR mock for error response
        const mockSWR = await import('swr');
        (mockSWR.default as any).mockImplementation((key: any) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    error: new Error('Failed to load account'),
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
        expect(screen.getByText(/Error loading vault transaction/i)).not.toBeNull();
    });

    test('renders Squads transaction with lookup table without crashing', async () => {
        // Setup SWR mock for successful response
        const mockSWR = await import('swr');
        (mockSWR.default as any).mockImplementation((key: any) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    data: VaultTransaction.fromAccountInfo(MOCK_SQUADS_LOOKUP_TABLE_ACCOUNT_INFO)[0],
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

        await waitFor(
            () => {
                expect(screen.queryByText(/Inspector Input/i)).toBeNull();
            },
            { interval: 50, timeout: 10000 }
        );

        await waitFor(
            () => {
                expect(screen.queryByText(/Loading/i)).toBeNull();
            },
            { interval: 50, timeout: 10000 }
        );

        // Check that the td with text Fee Payer has the text F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT
        expect(screen.getByRole('row', { name: /Fee Payer/i })).toHaveTextContent(
            '62gRsAdA6dcbf4Frjp7YRFLpFgdGu8emAACcnnREX3L3'
        );

        expect(screen.getByText(/Account List \(11\)/i)).not.toBeNull();
        expect(
            screen.getByText(/Unknown Program \(8TqqugH88U3fDEWeKHqBSxZKeqoRrXkdpy3ciX5GAruK\) Instruction/i)
        ).not.toBeNull();
    });
});
