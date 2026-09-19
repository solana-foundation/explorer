import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { DEFAULT_SIGNATURE, MOCK_PARSED_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

// The third account key is the Token program, which the mock accounts provider already holds, so the
// expanded content has an account to read.
const TOKEN_ACCOUNT_ROW = 2;

describe('transaction::AccountsCard expanded content', () => {
    test('should show the account details when a row expands', async () => {
        renderCard();

        await expandRow(TOKEN_ACCOUNT_ROW);

        expect(await screen.findByText('Allocated Data Size')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '36 byte(s)' })).toBeInTheDocument();
    });

    test('should show no details for a row that stays collapsed', async () => {
        renderCard();

        await expandRow(TOKEN_ACCOUNT_ROW);
        await screen.findByText('Allocated Data Size');

        expect(screen.getAllByText('Allocated Data Size')).toHaveLength(1);
    });

    test('should show the details again after a collapse', async () => {
        renderCard();
        await expandRow(TOKEN_ACCOUNT_ROW);
        await screen.findByText('Allocated Data Size');

        await userEvent.click(screen.getAllByRole('button', { name: 'Collapse account details' })[0]);
        expect(screen.queryByText('Allocated Data Size')).not.toBeInTheDocument();

        await expandRow(TOKEN_ACCOUNT_ROW);

        expect(await screen.findByText('Allocated Data Size')).toBeInTheDocument();
    });
});

function renderCard() {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
        { [DEFAULT_SIGNATURE]: MOCK_STATUS },
    );
    return render(
        <Wrapper>
            <AccountsCard signature={DEFAULT_SIGNATURE} />
        </Wrapper>,
    );
}

async function expandRow(index: number) {
    await userEvent.click(screen.getAllByRole('button', { name: 'Expand account details' })[index]);
}
