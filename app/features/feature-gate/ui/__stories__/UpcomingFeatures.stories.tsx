import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { UpcomingFeatures } from '../UpcomingFeatures';

const meta = {
    component: UpcomingFeatures,
    decorators: [withCluster, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/UpcomingFeatures',
} satisfies Meta<typeof UpcomingFeatures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
