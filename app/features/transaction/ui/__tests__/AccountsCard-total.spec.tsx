import { act, render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

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

import { DEFAULT_SIGNATURE, FEE_PAYER, MOCK_PARSED_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

describe('transaction::AccountsCard total size', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should sum the size of every account', async () => {
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));

        renderCard();

        expect(await screen.findByText('16 bytes')).toBeInTheDocument();
    });

    test('should count an account that does not exist as zero bytes', async () => {
        mockGetMultipleAccounts.mockImplementation(async addresses => {
            const [, ...rest] = sizedAccounts(addresses);
            return [null, ...rest];
        });

        renderCard();

        expect(await screen.findByText('12 bytes')).toBeInTheDocument();
    });

    test('should drop the total when the node does not report an account size', async () => {
        mockGetMultipleAccounts.mockImplementation(async addresses => {
            const [first, ...rest] = sizedAccounts(addresses);
            return [{ ...first, space: undefined }, ...rest];
        });

        renderCard();
        await sizesAnswered();

        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();
    });

    test('should keep the rows and drop the total when the sizes read fails', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        renderCard();
        await sizesAnswered();

        expect(screen.getAllByText(FEE_PAYER.toBase58())).not.toHaveLength(0);
        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();
    });
});

function renderCard() {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
    );
    return render(
        <SWRConfig value={{ provider: () => new Map() }}>
            <Wrapper>
                <AccountsCard signature={DEFAULT_SIGNATURE} />
            </Wrapper>
        </SWRConfig>,
    );
}

async function sizesAnswered() {
    await vi.waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1));
    await act(() => Promise.allSettled([mockGetMultipleAccounts.mock.results[0].value]));
}

function sizedAccounts(addresses: readonly unknown[]) {
    return addresses.map(() => ({ data: ['', 'base64'], space: 4n }));
}
