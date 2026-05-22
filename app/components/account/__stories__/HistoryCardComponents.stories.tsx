import type { Meta, StoryObj } from '@storybook/react';

import { HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';

const meta: Meta = {
    title: 'Components/Account/HistoryCardComponents',
};

export default meta;

const cardWrap = (children: React.ReactNode) => <div className="card">{children}</div>;

export const Header: StoryObj<typeof HistoryCardHeader> = {
    render: () =>
        cardWrap(
            <HistoryCardHeader
                title="Transaction History"
                analyticsSection="history_card_header"
                refresh={() => {}}
                fetching={false}
            />,
        ),
};

export const HeaderFetching: StoryObj<typeof HistoryCardHeader> = {
    render: () =>
        cardWrap(
            <HistoryCardHeader
                title="Transaction History"
                analyticsSection="history_card_header"
                refresh={() => {}}
                fetching={true}
            />,
        ),
};

export const FooterLoadMore: StoryObj<typeof HistoryCardFooter> = {
    render: () => cardWrap(<HistoryCardFooter fetching={false} foundOldest={false} loadMore={() => {}} />),
};

export const FooterFetching: StoryObj<typeof HistoryCardFooter> = {
    render: () => cardWrap(<HistoryCardFooter fetching={true} foundOldest={false} loadMore={() => {}} />),
};

export const FooterFoundOldest: StoryObj<typeof HistoryCardFooter> = {
    render: () => cardWrap(<HistoryCardFooter fetching={false} foundOldest={true} loadMore={() => {}} />),
};
