import { FetchStatus } from '@providers/cache';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import {
    DEFAULT_SIGNATURE,
    MOCK_PARSED_TX,
    MOCK_PARSED_TX_NO_BLOCK_TIME,
    MOCK_RAW_TX,
    MOCK_RAW_TX_NO_BLOCK_TIME,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

const IN_FLIGHT = { status: FetchStatus.Fetching };
const FIXTURE_BLOCK_TIME_UTC = 'May 18, 2024 at 02:40:00 UTC';

vi.mock('next/navigation', () => ({
    usePathname: () => `/tx/${DEFAULT_SIGNATURE}`,
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

function renderSummary({
    parsed = MOCK_PARSED_TX,
    raw = MOCK_RAW_TX,
}: { parsed?: typeof MOCK_PARSED_TX; raw?: typeof MOCK_RAW_TX } = {}) {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: parsed },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
        { [DEFAULT_SIGNATURE]: raw },
    );

    return render(
        <Wrapper>
            <SummaryCard signature={DEFAULT_SIGNATURE} autoRefresh={AutoRefresh.Inactive} />
        </Wrapper>,
    );
}

describe('SummaryCard timestamp', () => {
    it('should render the block time from the raw transaction', async () => {
        renderSummary({ parsed: MOCK_PARSED_TX_NO_BLOCK_TIME });

        expect(await findUtcTimestampRow()).toHaveTextContent(FIXTURE_BLOCK_TIME_UTC);
    });

    it('should use the parsed block time when the raw response has none', async () => {
        renderSummary({ raw: MOCK_RAW_TX_NO_BLOCK_TIME });

        expect(await findUtcTimestampRow()).toHaveTextContent(FIXTURE_BLOCK_TIME_UTC);
    });

    it('should omit the timestamp rows while both transaction fetches are in flight', async () => {
        renderSummary({ parsed: IN_FLIGHT, raw: IN_FLIGHT });

        expect(await screen.findByText('Signature')).toBeInTheDocument();
        expect(screen.queryByText('Timestamp (Local)')).not.toBeInTheDocument();
        expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
    });

    it('should render Unavailable when neither transaction has a block time', async () => {
        renderSummary({ parsed: MOCK_PARSED_TX_NO_BLOCK_TIME, raw: MOCK_RAW_TX_NO_BLOCK_TIME });

        expect(await screen.findByText('Unavailable')).toBeInTheDocument();
        expect(screen.queryByText('Timestamp (Local)')).not.toBeInTheDocument();
    });
});

async function findUtcTimestampRow() {
    return (await screen.findByText('Timestamp (UTC)')).parentElement;
}
