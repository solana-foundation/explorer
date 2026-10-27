import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { StakeHistoryCard } from '../StakeHistoryCard';
import * as Base from './StakeHistoryCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: StakeHistoryCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/StakeHistoryCard@Media',
} satisfies Meta<typeof StakeHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithEntries.args;

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
