import { FetchStatus } from '@providers/cache';
import { mockRawTransactionDetails } from '@storybook-config/__fixtures__/transactions';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AUTO_REFRESH_INTERVAL, AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import { DEFAULT_SIGNATURE, MOCK_PARSED_TX, MOCK_RAW_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

const RAW_NOT_FOUND = mockRawTransactionDetails();
const RAW_IN_FLIGHT = { status: FetchStatus.Fetching };
const STATUS_NOT_FOUND: typeof MOCK_STATUS = {
    data: { info: null, signature: DEFAULT_SIGNATURE },
    status: FetchStatus.Fetched,
};
const STATUS_FAILED: typeof MOCK_STATUS = { status: FetchStatus.FetchFailed };

// `ClusterProvider` reads the router on mount, which jsdom has no app router for.
vi.mock('next/navigation', () => ({
    usePathname: () => `/tx/${DEFAULT_SIGNATURE}`,
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

const fetchRaw = vi.hoisted(() => vi.fn());
vi.mock('@/app/providers/transactions/raw', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/transactions/raw')>()),
    useFetchRawTransaction: () => fetchRaw,
}));

describe('SummaryCard raw retry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should retry the raw fetch while the transaction has no wire bytes', async () => {
        renderSummary({ raw: RAW_NOT_FOUND });

        await tick();

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should retry the raw fetch from the Refresh button', () => {
        renderSummary({ autoRefresh: AutoRefresh.Inactive, raw: RAW_NOT_FOUND });

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should retry the raw fetch from the not-found card', () => {
        renderSummary({ autoRefresh: AutoRefresh.Inactive, raw: RAW_NOT_FOUND, status: STATUS_NOT_FOUND });

        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should retry the raw fetch from the error card', () => {
        renderSummary({ autoRefresh: AutoRefresh.Inactive, raw: RAW_NOT_FOUND, status: STATUS_FAILED });

        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should not refetch a raw transaction that is already found', async () => {
        renderSummary({ raw: MOCK_RAW_TX });

        await tick();

        expect(fetchRaw).not.toHaveBeenCalled();
    });

    it('should not open a second raw request while one is still running', async () => {
        renderSummary({ raw: RAW_IN_FLIGHT });

        await tick();

        expect(fetchRaw).not.toHaveBeenCalled();
    });
});

function renderSummary({
    raw,
    status = MOCK_STATUS,
    autoRefresh = AutoRefresh.Active,
}: {
    raw: typeof MOCK_RAW_TX;
    status?: typeof MOCK_STATUS;
    autoRefresh?: AutoRefresh;
}) {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
        { [DEFAULT_SIGNATURE]: status },
        { [DEFAULT_SIGNATURE]: raw },
    );

    return render(
        <Wrapper>
            <SummaryCard signature={DEFAULT_SIGNATURE} autoRefresh={autoRefresh} />
        </Wrapper>,
    );
}

async function tick() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL + 100);
    });
}
