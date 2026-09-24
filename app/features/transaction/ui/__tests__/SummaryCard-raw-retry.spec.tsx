import { FetchStatus } from '@providers/cache';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AUTO_REFRESH_INTERVAL, AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import { DEFAULT_SIGNATURE, MOCK_PARSED_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

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

/** `mockRawTransactionDetails` always sets `FetchStatus.Fetched`, so this helper builds the other states. */
function rawEntry(status: FetchStatus, raw?: null) {
    return { data: raw === null ? { raw: null } : undefined, status };
}

function renderSummary(entry: ReturnType<typeof rawEntry>, autoRefresh = AutoRefresh.Active) {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
        { [DEFAULT_SIGNATURE]: entry },
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

describe('SummaryCard raw retry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should retry the raw fetch while the transaction has no wire bytes', async () => {
        renderSummary(rawEntry(FetchStatus.Fetched, null));

        await tick();

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should retry the raw fetch from the Refresh button', () => {
        renderSummary(rawEntry(FetchStatus.Fetched, null), AutoRefresh.Inactive);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        expect(fetchRaw).toHaveBeenCalledWith(DEFAULT_SIGNATURE);
    });

    it('should not open a second raw request while one is still running', async () => {
        renderSummary(rawEntry(FetchStatus.Fetching));

        await tick();

        expect(fetchRaw).not.toHaveBeenCalled();
    });
});
