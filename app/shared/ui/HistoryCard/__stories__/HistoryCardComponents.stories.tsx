import type { Meta, StoryObj } from '@storybook-config/types';

import { HistoryCardFooter, HistoryCardHeader } from '..';

const meta: Meta = {
    tags: ['autodocs', 'test'],
    // TODO(storybook): rename to 'Shared/UI/HistoryCard' once the Dashkit migration settles — kept stable for now to avoid churning the Storybook tree mid-migration.
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
