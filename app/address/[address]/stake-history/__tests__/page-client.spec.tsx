import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StakeHistoryPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@features/stake', () => ({ StakeHistoryCard: () => <div data-testid="stake-history-card" /> }));

describe('StakeHistoryPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the stake history card for a sysvar stakeHistory account', () => {
        mock.account = { data: { parsed: { parsed: { info: {}, type: 'stakeHistory' }, program: 'sysvar' } } };
        render(<StakeHistoryPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('stake-history-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a sysvar account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<StakeHistoryPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('stake-history-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });

    it('should call onNotFound when the sysvar account is not stakeHistory', () => {
        mock.account = { data: { parsed: { parsed: { info: {}, type: 'slotHashes' }, program: 'sysvar' } } };
        render(<StakeHistoryPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('stake-history-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
