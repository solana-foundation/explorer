import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { UpcomingFeatures } from '../UpcomingFeatures';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: UpcomingFeatures,
    decorators: [withViewportFromGlobal, withCluster, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/UpcomingFeatures@Media',
} satisfies Meta<typeof UpcomingFeatures>;

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
