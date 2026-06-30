import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { HistoryCardFooter, HistoryCardHeader } from '..';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    // TODO(storybook): rename to 'Shared/UI/HistoryCard@Media' once the Dashkit migration settles — kept stable for now to avoid churning the Storybook tree mid-migration.
    title: 'Components/Account/HistoryCardComponents@Media',
};

export default meta;

const renderHeader = () => (
    <HistoryCardHeader
        title="Transaction History"
        analyticsSection="history_card_header"
        refresh={() => {}}
        fetching={false}
    />
);

const renderFooter = () => <HistoryCardFooter fetching={false} foundOldest={true} loadMore={() => {}} />;

export const HeaderMobile: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { value: 'iphonex' } },
    render: renderHeader,
};

export const HeaderTabletPortrait: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { value: 'ipad' } },
    render: renderHeader,
};

export const HeaderTabletLandscape: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: renderHeader,
};

export const FooterMobile: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { value: 'iphonex' } },
    render: renderFooter,
};

export const FooterTabletPortrait: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { value: 'ipad' } },
    render: renderFooter,
};

export const FooterTabletLandscape: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: renderFooter,
};
