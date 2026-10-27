import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { rpcValueStub } from '@/app/__tests__/mock-rpc';
import { swrWrapper } from '@/app/__tests__/swr-hook';

vi.mock('next/navigation');

const mockGetMultipleAccounts = vi.fn();

vi.mock('@/app/entities/cluster/api/get-rpc', () => ({
    getRpc: () => rpcValueStub({ getMultipleAccounts: mockGetMultipleAccounts }),
}));

import { FEE_PAYER } from '../__fixtures__/transaction';
import { accountsCardWithProviders } from '../__fixtures__/withTransactionProviders';

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
    return render(accountsCardWithProviders(), { wrapper: swrWrapper() });
}

async function sizesAnswered() {
    await vi.waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1));
    await act(() => Promise.allSettled([mockGetMultipleAccounts.mock.results[0].value]));
}

function sizedAccounts(addresses: readonly unknown[]) {
    return addresses.map(() => ({ data: ['', 'base64'], space: 4n }));
}
