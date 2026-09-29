import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { gen } from '@__fixtures__/gen';

import { ClusterProvider } from '@/app/providers/cluster';

import { Address } from '../Address';

const PUBKEY = gen.publicKey(1);

describe('Address nickname editor', () => {
    test('should show no dialog until the button opens it', () => {
        renderAddress();

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('should open the editor for the address', async () => {
        renderAddress();

        await userEvent.click(screen.getByTitle('Edit nickname'));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Edit Nickname');
        expect(dialog).toHaveTextContent(PUBKEY.toBase58());
    });

    test('should close the editor on Cancel', async () => {
        renderAddress();
        await userEvent.click(screen.getByTitle('Edit nickname'));
        await screen.findByRole('dialog');

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    test('should open the editor again after a close', async () => {
        renderAddress();
        await userEvent.click(screen.getByTitle('Edit nickname'));
        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        await userEvent.click(screen.getByTitle('Edit nickname'));

        expect(await screen.findByRole('dialog')).toHaveTextContent('Edit Nickname');
    });
});

function renderAddress() {
    return render(
        <ClusterProvider>
            <Address pubkey={PUBKEY} />
        </ClusterProvider>,
    );
}
