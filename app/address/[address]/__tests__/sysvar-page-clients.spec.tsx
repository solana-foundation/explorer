import { parsedAccount } from '@components/account/__mocks__/ParsedAccountRenderer';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecentBlockhashesPageClient from '../blockhashes/page-client';
import SlotHashesPageClient from '../slot-hashes/page-client';
import StakeHistoryPageClient from '../stake-history/page-client';

vi.mock('@components/account/ParsedAccountRenderer');
vi.mock('@components/account/BlockhashesCard', () => ({
    BlockhashesCard: () => <div data-testid="blockhashes-card" />,
}));
vi.mock('@components/account/SlotHashesCard', () => ({ SlotHashesCard: () => <div data-testid="slot-hashes-card" /> }));
vi.mock('@features/stake', () => ({ StakeHistoryCard: () => <div data-testid="stake-history-card" /> }));

describe.each([
    {
        Page: RecentBlockhashesPageClient,
        cardTestId: 'blockhashes-card',
        info: [],
        otherType: 'slotHashes',
        type: 'recentBlockhashes',
    },
    {
        Page: SlotHashesPageClient,
        cardTestId: 'slot-hashes-card',
        info: [],
        otherType: 'recentBlockhashes',
        type: 'slotHashes',
    },
    {
        Page: StakeHistoryPageClient,
        cardTestId: 'stake-history-card',
        info: {},
        otherType: 'slotHashes',
        type: 'stakeHistory',
    },
])('$Page.name', ({ Page, cardTestId, info, otherType, type }) => {
    it(`should render the card for a sysvar ${type} account`, () => {
        parsedAccount.account = { data: { parsed: { parsed: { info, type }, program: 'sysvar' } } };
        render(<Page params={{ address: 'addr' }} />);
        expect(screen.getByTestId(cardTestId)).toBeInTheDocument();
        expect(parsedAccount.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not a sysvar account', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<Page params={{ address: 'addr' }} />);
        expect(screen.queryByTestId(cardTestId)).not.toBeInTheDocument();
        expect(parsedAccount.onNotFound).toHaveBeenCalledOnce();
    });

    it(`should call onNotFound when the sysvar account is not ${type}`, () => {
        parsedAccount.account = { data: { parsed: { parsed: { info: {}, type: otherType }, program: 'sysvar' } } };
        render(<Page params={{ address: 'addr' }} />);
        expect(screen.queryByTestId(cardTestId)).not.toBeInTheDocument();
        expect(parsedAccount.onNotFound).toHaveBeenCalledOnce();
    });
});
