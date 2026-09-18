import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getNickname, setNickname } from '../../lib/nicknames';
import { NicknameEditor } from '../NicknameEditor';

const ADDRESS = 'So11111111111111111111111111111111111111112';

describe('NicknameEditor', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('should prefill the saved nickname', async () => {
        setNickname(ADDRESS, 'Treasury');

        renderEditor();

        expect(await screen.findByLabelText('Nickname')).toHaveValue('Treasury');
    });

    test('should offer Remove for an address that has a nickname', async () => {
        setNickname(ADDRESS, 'Treasury');

        renderEditor();

        expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    test('should offer no Remove for an address that has none', async () => {
        renderEditor();

        await screen.findByRole('button', { name: 'Save' });
        expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    });

    // The field holds a draft. Clearing it is how a nickname is saved away, so Remove has to stay
    // reachable for the one still in the store.
    test('should keep Remove while the field is cleared', async () => {
        setNickname(ADDRESS, 'Treasury');
        renderEditor();
        await screen.findByRole('button', { name: 'Remove' });

        await userEvent.clear(await screen.findByLabelText('Nickname'));

        expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    test('should remove the saved nickname on Remove', async () => {
        setNickname(ADDRESS, 'Treasury');
        const onClose = vi.fn();
        renderEditor(onClose);

        await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));

        expect(getNickname(ADDRESS)).toBeNull();
        expect(onClose).toHaveBeenCalled();
    });
});

function renderEditor(onClose: () => void = () => {}) {
    return render(<NicknameEditor address={ADDRESS} open onClose={onClose} />);
}
