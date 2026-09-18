import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { DEFAULT_SIGNATURE, FEE_PAYER, MOCK_PARSED_TX, MOCK_STATUS } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

describe('transaction::AccountsCard slideover', () => {
    test('should open the tapped account', async () => {
        renderCard();

        await tapFeePayer();

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Account 1');
        expect(dialog).toHaveTextContent(FEE_PAYER.toBase58());
    });

    test('should close on Close', async () => {
        renderCard();
        await tapFeePayer();
        await screen.findByRole('dialog');

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    test('should open again after a close', async () => {
        renderCard();
        await tapFeePayer();
        await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        await tapFeePayer();

        expect(await screen.findByRole('dialog')).toHaveTextContent('Account 1');
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

// jsdom matches no media query, so the rows render their mobile variant and a tap opens the slideover.
async function tapFeePayer() {
    await userEvent.click(screen.getAllByText(FEE_PAYER.toBase58())[0]);
}
