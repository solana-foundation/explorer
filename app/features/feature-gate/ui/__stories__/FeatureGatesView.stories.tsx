import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { FeatureGatesView } from '../FeatureGatesView';

const meta: Meta<typeof FeatureGatesView> = {
    component: FeatureGatesView,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/FeatureGatesView',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
