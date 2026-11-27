import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VotesCard } from '../VotesCard';
import * as Base from './VotesCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof VotesCard> = {
    component: VotesCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VotesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithVotes.args;

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
