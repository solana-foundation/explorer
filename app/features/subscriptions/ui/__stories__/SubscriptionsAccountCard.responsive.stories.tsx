import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';
import * as Base from './SubscriptionsAccountCard.stories';

const args = Base.Plan.args;

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: SubscriptionsAccountCard,
    decorators: [withMockRpc, withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/SubscriptionsAccountCard@Media',
} satisfies Meta<typeof SubscriptionsAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

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
