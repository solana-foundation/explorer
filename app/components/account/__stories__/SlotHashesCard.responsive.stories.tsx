import { withCluster } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SlotHashesCard } from '../SlotHashesCard';
import * as Base from './SlotHashesCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof SlotHashesCard> = {
    component: SlotHashesCard,
    decorators: [withViewportFromGlobal, withCluster],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/SlotHashesCard@Media',
};

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
