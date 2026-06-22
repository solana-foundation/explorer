import type { Meta, StoryObj } from '@storybook-config/types';

import { HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';

const meta: Meta = {
    tags: ['autodocs', 'test'],
    title: 'Components/Account/HistoryCardComponents',
};

export default meta;

export const Header: StoryObj<typeof HistoryCardHeader> = {
    render: () => (
        <HistoryCardHeader
            title="Transaction History"
            analyticsSection="history_card_header"
            refresh={() => {}}
            fetching={false}
        />
    ),
};

export const HeaderFetching: StoryObj<typeof HistoryCardHeader> = {
    render: () => (
        <HistoryCardHeader
            title="Transaction History"
            analyticsSection="history_card_header"
            refresh={() => {}}
            fetching={true}
        />
    ),
};

export const FooterLoadMore: StoryObj<typeof HistoryCardFooter> = {
    render: () => <HistoryCardFooter fetching={false} foundOldest={false} loadMore={() => {}} />,
};

export const FooterFetching: StoryObj<typeof HistoryCardFooter> = {
    render: () => <HistoryCardFooter fetching={true} foundOldest={false} loadMore={() => {}} />,
};

export const FooterFoundOldest: StoryObj<typeof HistoryCardFooter> = {
    render: () => <HistoryCardFooter fetching={false} foundOldest={true} loadMore={() => {}} />,
};
