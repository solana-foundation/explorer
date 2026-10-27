import { withClusterAndAccounts } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { RewardsCard } from '../RewardsCard';
import * as Base from './RewardsCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: RewardsCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/RewardsCard@Media',
} satisfies Meta<typeof RewardsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.WithRewardsList;

export const Mobile: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    decorators,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
