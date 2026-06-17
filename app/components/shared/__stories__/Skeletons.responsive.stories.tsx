import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { RichListSkeleton, SimpleCardSkeleton, StatsTableSkeleton, TableCardSkeleton } from '../Skeletons';

const meta: Meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Skeletons@Media',
};

export default meta;

type SimpleStory = StoryObj<typeof SimpleCardSkeleton>;

export const SimpleCardMobile: SimpleStory = {
    globals: { viewport: { value: 'iphonex' } },
    render: () => <SimpleCardSkeleton withTitle />,
};

export const RichListMobile: StoryObj<typeof RichListSkeleton> = {
    globals: { viewport: { value: 'iphonex' } },
    render: () => <RichListSkeleton />,
};

export const StatsTableTabletPortrait: StoryObj<typeof StatsTableSkeleton> = {
    globals: { viewport: { value: 'ipad' } },
    render: () => <StatsTableSkeleton />,
};

export const TableCardTabletLandscape: StoryObj<typeof TableCardSkeleton> = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: () => <TableCardSkeleton />,
};
