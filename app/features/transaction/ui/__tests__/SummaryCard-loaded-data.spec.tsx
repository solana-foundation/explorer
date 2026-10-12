import { render, screen } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import {
    DEFAULT_SIGNATURE,
    MOCK_PARSED_TX,
    MOCK_PARSED_V1_TX,
    MOCK_RAW_TX,
    MOCK_RAW_V1_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';
import { SummaryCard } from '../SummaryCard';

// `ClusterProvider` reads the router on mount, which jsdom has no app router for.
vi.mock('next/navigation', () => ({
    usePathname: () => `/tx/${DEFAULT_SIGNATURE}`,
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

const mockGetMultipleAccounts = vi.fn();

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getMultipleAccounts: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetMultipleAccounts(...args) }),
            }),
        })),
    };
});

// `InfoTooltip` pins the label's last word to its help icon inside a nested `nowrap` span, so match
// on the innermost element whose full text equals the label.
function byLabelText(label: string) {
    return (_content: string, element: Element | null): boolean => {
        if (element?.textContent !== label) return false;
        return Array.from(element.children).every(child => child.textContent !== label);
    };
}

describe('SummaryCard loaded accounts data size', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetMultipleAccounts.mockImplementation(async addresses =>
            addresses.map(() => ({ data: ['', 'base64'], owner: '11111111111111111111111111111111', space: 4n })),
        );
    });

    it('should show what a v1 transaction loads against the limit it declares', async () => {
        renderSummary(MOCK_RAW_V1_TX);

        // The parsed fixture names four accounts of 4 bytes each, charged 64 bytes apiece on top.
        expect(await screen.findByText('272 / 75,013 bytes')).toBeInTheDocument();
        expect(screen.getByText(byLabelText('Loaded Data / Limit'))).toBeInTheDocument();
    });

    it('should still show the limit when the accounts cannot be read', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderSummary(MOCK_RAW_V1_TX);

        expect(await screen.findByText('75,013 bytes')).toBeInTheDocument();
        expect(screen.getByText(byLabelText('Loaded Data Limit'))).toBeInTheDocument();
    });

    it('should leave the total to the summary, so the Accounts card reads nothing', async () => {
        renderSummary(MOCK_RAW_V1_TX, <AccountsCard signature={DEFAULT_SIGNATURE} />);

        expect(await screen.findByText('272 / 75,013 bytes')).toBeInTheDocument();
        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();
        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1);
    });

    it('should leave the row out, and read no accounts, before v1', async () => {
        renderSummary(MOCK_RAW_TX);

        expect(await screen.findByText('Fee')).toBeInTheDocument();
        expect(screen.queryByText(byLabelText('Loaded Data / Limit'))).not.toBeInTheDocument();
        expect(screen.queryByText(byLabelText('Loaded Data Limit'))).not.toBeInTheDocument();
        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });
});

function renderSummary(raw: typeof MOCK_RAW_TX, alongside?: React.ReactNode) {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: raw === MOCK_RAW_TX ? MOCK_PARSED_TX : MOCK_PARSED_V1_TX },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
        { [DEFAULT_SIGNATURE]: raw },
    );

    return render(
        <SWRConfig value={{ errorRetryCount: 0, provider: () => new Map() }}>
            <Wrapper>
                <SummaryCard signature={DEFAULT_SIGNATURE} autoRefresh={AutoRefresh.Inactive} />
                {alongside}
            </Wrapper>
        </SWRConfig>,
    );
}
