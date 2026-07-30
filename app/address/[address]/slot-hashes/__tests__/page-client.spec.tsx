import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SlotHashesPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@components/account/SlotHashesCard', () => ({ SlotHashesCard: () => <div data-testid="slot-hashes-card" /> }));

describe('SlotHashesPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the slot hashes card for a sysvar slotHashes account', () => {
        mock.account = { data: { parsed: { parsed: { info: [], type: 'slotHashes' }, program: 'sysvar' } } };
        render(<SlotHashesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('slot-hashes-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a sysvar account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<SlotHashesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('slot-hashes-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });

    it('should call onNotFound when the sysvar account is not slotHashes', () => {
        mock.account = { data: { parsed: { parsed: { info: {}, type: 'recentBlockhashes' }, program: 'sysvar' } } };
        render(<SlotHashesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('slot-hashes-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
