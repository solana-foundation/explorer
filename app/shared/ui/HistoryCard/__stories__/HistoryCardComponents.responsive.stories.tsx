import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { HistoryCardFooter, HistoryCardHeader } from '..';
import * as Base from './HistoryCardComponents.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta = {
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    // TODO(storybook): rename to 'Shared/UI/HistoryCard@Media' once the Dashkit migration settles — kept stable for now to avoid churning the Storybook tree mid-migration.
    title: 'Components/Account/HistoryCardComponents@Media',
};

export default meta;

export const HeaderMobile: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { value: 'iphonex' } },
    render: Base.Header.render,
};

export const HeaderTabletPortrait: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { value: 'ipad' } },
    render: Base.Header.render,
};

export const HeaderTabletLandscape: StoryObj<typeof HistoryCardHeader> = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: Base.Header.render,
};

export const FooterMobile: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { value: 'iphonex' } },
    render: Base.FooterFoundOldest.render,
};

export const FooterTabletPortrait: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { value: 'ipad' } },
    render: Base.FooterFoundOldest.render,
};

export const FooterTabletLandscape: StoryObj<typeof HistoryCardFooter> = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: Base.FooterFoundOldest.render,
};
