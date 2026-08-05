import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VoteHistoryPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@features/vote', () => ({ VotesCard: () => <div data-testid="votes-card" /> }));

describe('VoteHistoryPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the votes card for a vote account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<VoteHistoryPageClient params={{ address: 'Vote111111111111111111111111111111111111111' }} />);
        expect(screen.getByTestId('votes-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a vote account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'stake' } } };
        render(<VoteHistoryPageClient params={{ address: 'Vote111111111111111111111111111111111111111' }} />);
        expect(screen.queryByTestId('votes-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
