import { AccountInfo } from '@solana/web3.js';
import { generated, PROGRAM_ID } from '@sqds/multisig';
const { VaultTransaction } = generated;
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import { sleep } from '@/app/__tests__/mocks';
import { GET } from '@/app/api/anchor/route';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { TransactionInspectorPage } from '../InspectorPage';

type ColumnMatcher = {
    columnIndex: number;
    regex: RegExp;
};

/**
 * Find a table row where specified columns match given regex patterns
 * @param container The container element to search within
 * @param matchers Array of column matchers with index and regex
 * @returns The matching row element or null if not found
 */
export function findTableRowWithMatches(container: HTMLElement, matchers: ColumnMatcher[]): HTMLElement | null {
    const rows = container.querySelectorAll('tr');

    const matchingRow = Array.from(rows).find(row => {
        const cells = row.querySelectorAll('td');

        return matchers.every(matcher => {
            if (matcher.columnIndex >= cells.length) return false;
            const cellContent = cells[matcher.columnIndex].textContent || '';
            return matcher.regex.test(cellContent);
        });
    });

    return matchingRow || null;
}

// Create mocks for the required dependencies
const mockUseSearchParams = (message: string) => {
    if (!message) throw new Error('Message is absent');

    const params = new URLSearchParams();
    // Normal Squads transaction
    params.set('message', message);
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

const DEFAULT_INTERVAL = { interval: 50, timeout: 10000 };
async function expectWaitFor(fn: () => void, params: object = DEFAULT_INTERVAL) {
    await waitFor(fn, params);
}

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

describe("TransactionInspectorPage with SystemProgram' instructions", () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (typeof target === 'string' && target.startsWith('/api/anchor')) {
            return GET({ url: target } as Request);
        }
        return originalFetch(input, init);
    });

    beforeEach(async () => {
        // sleep to allow not facing 429s
        await sleep();

        // Setup router mock
        const mockRouter = { push: vi.fn(), replace: vi.fn() };
        vi.spyOn(await import('next/navigation'), 'useRouter').mockReturnValue(mockRouter as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders SystemProgram::CreateAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramCreateAccountQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container } = render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <TransactionInspectorPage showTokenBalanceChanges={false} />
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        // Wait for initial and temporary elements to disappear separately
        await expectWaitFor(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await expectWaitFor(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        // Check that the td with text Fee Payer has the text F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT
        // expect(screen.getByRole('row', { name: /Fee Payer/i })).toHaveTextContent(
        //     '62gRsAdA6dcbf4Frjp7YRFLpFgdGu8emAACcnnREX3L3'
        // );

        // expect(screen.getByText(/Account List \(11\)/i)).not.toBeNull();
        expect(screen.getByText(/System Program: Create Account/i)).not.toBeNull();

        const matchedRows = findTableRowWithMatches(container, [
            {
                columnIndex: 0,
                regex: /Program/,
            },
        ]);
        expect(matchedRows).not.toBeNull();
    });
});
