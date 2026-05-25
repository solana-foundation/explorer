import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { UpcomingFeatures } from '../UpcomingFeatures';

const meta = {
    component: UpcomingFeatures,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Utils/FeatureGate/UpcomingFeatures',
} satisfies Meta<typeof UpcomingFeatures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
