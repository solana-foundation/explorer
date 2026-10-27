import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { FeatureGateCard } from '../FeatureGateCard';
import * as Base from './FeatureGateCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof FeatureGateCard> = {
    args: Base.Default.args,
    component: FeatureGateCard,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureGateCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
