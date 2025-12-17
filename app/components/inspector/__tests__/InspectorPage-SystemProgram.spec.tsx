import { SystemProgram } from '@solana/web3.js';
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
function findTableRowWithMatches(container: HTMLElement, matchers: ColumnMatcher[]): HTMLElement | null {
    // eslint-disable-next-line testing-library/no-node-access
    const rows = container.querySelectorAll('tr');

    const matchingRow = Array.from(rows).find(row => {
        // eslint-disable-next-line testing-library/no-node-access
        const cells = row.querySelectorAll('td');

        return matchers.every(matcher => {
            if (matcher.columnIndex >= cells.length) return false;
            const cellContent = cells[matcher.columnIndex].textContent || '';
            return matcher.regex.test(cellContent);
        });
    });

    return matchingRow || null;
}

/**
 * Populate column matchers into the proper struct
 *
 * @param matches List of regexps to match against
 * @returns
 */
function populateColumnMatchers(matches: RegExp[]) {
    return matches.reduce((acc, next, index) => {
        return acc.concat([{ columnIndex: index, regex: next }]);
    }, [] as ColumnMatcher[]);
}

const mockUseSearchParams = (message: string) => {
    if (!message) throw new Error('Message is absent');

    const params = new URLSearchParams();
    // URL-encoded representation of serialized and base64 encoded MessageV0
    params.set('message', decodeURIComponent(message));
    return params;
};

const DEFAULT_INTERVAL = { interval: 50, timeout: 10000 };
async function waitForTimeout(fn: () => void, params: object = DEFAULT_INTERVAL) {
    await waitFor(fn, params);
}

/** Mock the necessary environment for a nextjs page */
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

// Mock next/link
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
/** end */

describe("TransactionInspectorPage with SystemProgram' instructions", () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (typeof target === 'string' && target.startsWith('/api/anchor')) {
            return GET({ url: target } as Request);
        }
        return originalFetch(input, init);
    });

    /**
     * Function that checks that all the matches are present
     *
     * @param container HTML node to check for a proper layout
     * @param columnsRegexps List of matchers
     */
    function expectAllColumnsNotNull(container: HTMLElement, columnsRegexps: Array<[RegExp, RegExp]>) {
        columnsRegexps.forEach(matchers => {
            expect(findTableRowWithMatches(container, populateColumnMatchers(matchers))).not.toBeNull();
        });
    }

    beforeEach(async () => {
        // sleep to allow not facing 429s
        await sleep();

        // Setup router mock
        const mockRouter = { push: vi.fn(), replace: vi.fn() };
        vi.spyOn(await import('next/navigation'), 'useRouter').mockReturnValue(mockRouter as any);

        // Mock accountInfo to prevent the UI stuck upon loading
        vi.mock('@providers/accounts', async () => {
            const actual = await vi.importActual('@providers/accounts');
            return {
                ...actual,
                useAccountInfo: () => ({
                    data: {
                        lamports: 1000000,
                        owner: SystemProgram.programId,
                        space: 0,
                    },
                    status: 'fetched',
                }),
            };
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders SystemProgram::CreateAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramCreateAccountQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        // expect(screen.getByText(/Account List \(11\)/i)).not.toBeNull();
        expect(screen.getByText(/System Program: Create Account/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/From Address/, /paykgcZ547qCd1sm3kBn83t9Fnr2hxM6anLBXhV7Fhn/],
                [/New Address/, /recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp/],
                [/Transfer Amount \(SOL\)/, /0.001/],
                [/Allocated Data Size/, /100 byte\(s\)/],
                [/Assigned Program Id/, /Associated Token Program/],
            ]);
        });
    });

    test('renders SystemProgram::CreateAccountWithSeed instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramCreateAccountWithSeedQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Create Account w\/ Seed/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/From Address/, /paykgcZ547qCd1sm3kBn83t9Fnr2hxM6anLBXhV7Fhn/],
                [/New Address/, /recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp/],
                [/Base Address/, /Base4feziQk7rNDM1GfCnU6BMAUQiY7MBtJ7qctugFJp/],
                [/Seed/, /test-seed/],
                [/Transfer Amount \(SOL\)/, /0.002/],
                [/Allocated Data Size/, /200 byte\(s\)/],
                [/Assigned Program Id/, /Associated Token Program/],
            ]);
        });
    });

    test('renders SystemProgram::Allocate instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramAllocateQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Allocate Account/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Account Address/, /recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp/],
                [/Allocated Data Size/, /300 byte\(s\)/],
            ]);
        });
    });

    test('renders SystemProgram::Assign instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramAssignQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });

        // Wait for the proper card to be rendered to prevent failing upon `Loading`
        expect(screen.getByText(/System Program: Assign Account/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Account Address/, /recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp/],
                [/Assigned Program Id/, /Associated Token Program/],
            ]);
        });
    });

    test('renders SystemProgram::Transfer instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramTransferQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Transfer/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/From Address/, /paykgcZ547qCd1sm3kBn83t9Fnr2hxM6anLBXhV7Fhn/],
                [/To Address/, /destqL3WARuT1i7W4tyMr7e62fc5PjoQzuu2Cbpsf2p/],
                [/Transfer Amount \(SOL\)/, /0.005/],
            ]);
        });
    });

    test('renders SystemProgram::AdvanceNonceAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramAdvanceNonceQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Advance Nonce/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Nonce Address/, /NonCboKHT9aKXzy87SQxX5ZWZ3u8VRVf5G6pm5NimtR/],
                [/Authority Address/, /NautFCh9z5i4uN3ZCbEABf4ompPCPkzGzHKMcUbBUnf/],
            ]);
        });
    });

    test('renders SystemProgram::WithdrawNonceAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramWithdrawNonceQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Withdraw Nonce/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Nonce Address/, /NonCboKHT9aKXzy87SQxX5ZWZ3u8VRVf5G6pm5NimtR/],
                [/Authority Address/, /NautFCh9z5i4uN3ZCbEABf4ompPCPkzGzHKMcUbBUnf/],
                [/To Address/, /destqL3WARuT1i7W4tyMr7e62fc5PjoQzuu2Cbpsf2p/],
                [/Withdraw Amount \(SOL\)/, /0.001/],
            ]);
        });
    });

    test('renders SystemProgram::AuthorizeNonceAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramAuthorizeNonceQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Authorize Nonce/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Nonce Address/, /NonCboKHT9aKXzy87SQxX5ZWZ3u8VRVf5G6pm5NimtR/],
                [/Old Authority Address/, /NautFCh9z5i4uN3ZCbEABf4ompPCPkzGzHKMcUbBUnf/],
                [/New Authority Address/, /destqL3WARuT1i7W4tyMr7e62fc5PjoQzuu2Cbpsf2p/],
            ]);
        });
    });

    test('renders SystemProgram::InitializeNonceAccount instruction', async () => {
        // Setup search params mock
        const mockUseSearchParamsReturn = mockUseSearchParams(stubs.systemProgramInitializeNonceQueryParam);
        vi.spyOn(await import('next/navigation'), 'useSearchParams').mockReturnValue(mockUseSearchParamsReturn as any);

        const { container: c } = render(
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
        await waitForTimeout(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitForTimeout(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });

        expect(screen.getByText(/System Program: Initialize Nonce/i)).not.toBeNull();

        await waitForTimeout(() => {
            expectAllColumnsNotNull(c, [
                [/Program/, /System Program/],
                [/Nonce Address/, /NonCboKHT9aKXzy87SQxX5ZWZ3u8VRVf5G6pm5NimtR/],
                [/Authority Address/, /NautFCh9z5i4uN3ZCbEABf4ompPCPkzGzHKMcUbBUnf/],
            ]);
        });
    });
});
