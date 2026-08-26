import { render, screen } from '@testing-library/react';
import React from 'react';

import { AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import {
    DEFAULT_SIGNATURE,
    MOCK_OVER_REQUESTED_CU_TX,
    MOCK_PARSED_TX,
    MOCK_RAW_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

// `ClusterProvider` reads the router on mount, which jsdom has no app router for.
vi.mock('next/navigation', () => ({
    usePathname: () => `/tx/${DEFAULT_SIGNATURE}`,
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

function renderSummary(parsed = MOCK_PARSED_TX) {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: parsed },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
        { [DEFAULT_SIGNATURE]: MOCK_RAW_TX },
    );

    return render(
        <Wrapper>
            <SummaryCard signature={DEFAULT_SIGNATURE} autoRefresh={AutoRefresh.Inactive} />
        </Wrapper>,
    );
}

describe('SummaryCard SIMD-0553 fee projection', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should omit the row when the flag is off', async () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'false');

        renderSummary();

        // The fee row itself still renders, so this asserts the projection alone is gated.
        expect(await screen.findByText('Fee')).toBeInTheDocument();
        expect(screen.queryByText('Fee under SIMD-0553')).not.toBeInTheDocument();
    });

    it('should render a projection per staged rate when the flag is on', async () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'true');

        renderSummary();

        expect(await screen.findByText('Fee under SIMD-0553')).toBeInTheDocument();
        expect(screen.getByText('at the 1/10 rate')).toBeInTheDocument();
        expect(screen.getByText('at the 1/4 rate')).toBeInTheDocument();
        expect(screen.getByText('at the 1/2 rate')).toBeInTheDocument();
    });

    it('should project a lean transfer below the flat base fee it paid', async () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'true');

        renderSummary();

        // 1,481 cost units at the terminal rate: 2,500 inclusion + ceil(1481/2) = 3,241 lamports,
        // against the 5,000 the transaction actually paid.
        expect(await screen.findByText('◎0.000003241')).toBeInTheDocument();
    });

    it('should project a loose compute budget above the fee it paid', async () => {
        vi.stubEnv('NEXT_PUBLIC_SIMD_0553_FEE_ENABLED', 'true');

        renderSummary(MOCK_OVER_REQUESTED_CU_TX);

        // 201,481 cost units at the terminal rate: 2,500 + ceil(201481/2) = 103,241 lamports.
        expect(await screen.findByText('◎0.000103241')).toBeInTheDocument();
    });
});
