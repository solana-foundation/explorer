import { parsedAccount } from '@components/account/__mocks__/ParsedAccountRenderer';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import VoteHistoryPageClient from '../page-client';

vi.mock('@components/account/ParsedAccountRenderer');
vi.mock('@features/vote', () => ({ VotesCard: () => <div data-testid="votes-card" /> }));

describe('VoteHistoryPageClient', () => {
    it('should render the votes card for a vote account', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<VoteHistoryPageClient params={{ address: 'Vote111111111111111111111111111111111111111' }} />);
        expect(screen.getByTestId('votes-card')).toBeInTheDocument();
        expect(parsedAccount.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a vote account', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'stake' } } };
        render(<VoteHistoryPageClient params={{ address: 'Vote111111111111111111111111111111111111111' }} />);
        expect(screen.queryByTestId('votes-card')).not.toBeInTheDocument();
        expect(parsedAccount.onNotFound).toHaveBeenCalledOnce();
    });
});
