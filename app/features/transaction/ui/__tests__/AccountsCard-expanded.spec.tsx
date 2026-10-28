import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { accountsCardWithProviders } from '../__fixtures__/withTransactionProviders';

const TOKEN_ACCOUNT_ROW = 2;

describe('transaction::AccountsCard expanded content', () => {
    test('should show the account details when a row expands', async () => {
        render(accountsCardWithProviders());

        await expandRow(TOKEN_ACCOUNT_ROW);

        expect(await screen.findByText('Allocated Data Size')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '36 byte(s)' })).toBeInTheDocument();
    });

    test('should show no details for a row that stays collapsed', async () => {
        render(accountsCardWithProviders());

        await expandRow(TOKEN_ACCOUNT_ROW);
        await screen.findByText('Allocated Data Size');

        expect(screen.getAllByText('Allocated Data Size')).toHaveLength(1);
    });

    test('should show the details again after a collapse', async () => {
        render(accountsCardWithProviders());
        await expandRow(TOKEN_ACCOUNT_ROW);
        await screen.findByText('Allocated Data Size');

        await userEvent.click(screen.getAllByRole('button', { name: 'Collapse account details' })[0]);
        expect(screen.queryByText('Allocated Data Size')).not.toBeInTheDocument();

        await expandRow(TOKEN_ACCOUNT_ROW);

        expect(await screen.findByText('Allocated Data Size')).toBeInTheDocument();
    });
});

async function expandRow(index: number) {
    await userEvent.click(screen.getAllByRole('button', { name: 'Expand account details' })[index]);
}
