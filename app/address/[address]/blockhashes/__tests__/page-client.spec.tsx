import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RecentBlockhashesPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@components/account/BlockhashesCard', () => ({
    BlockhashesCard: () => <div data-testid="blockhashes-card" />,
}));

describe('RecentBlockhashesPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the blockhashes card for a sysvar recentBlockhashes account', () => {
        mock.account = { data: { parsed: { parsed: { info: [], type: 'recentBlockhashes' }, program: 'sysvar' } } };
        render(<RecentBlockhashesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('blockhashes-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a sysvar account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<RecentBlockhashesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('blockhashes-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });

    it('should call onNotFound when the sysvar account is not recentBlockhashes', () => {
        mock.account = { data: { parsed: { parsed: { info: {}, type: 'slotHashes' }, program: 'sysvar' } } };
        render(<RecentBlockhashesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('blockhashes-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
