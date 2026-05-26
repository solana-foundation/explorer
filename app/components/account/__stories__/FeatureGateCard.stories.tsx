import type { Meta, StoryObj } from '@storybook/react';

import { FeatureGateCard } from '../FeatureGateCard';

const meta: Meta<typeof FeatureGateCard> = {
    component: FeatureGateCard,
    tags: ['autodocs'],
    title: 'Components/Account/FeatureGateCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <FeatureGateCard>
            This feature gate controls the activation of cluster-level functionality. Activate it to enable the new
            behaviour cluster-wide.
        </FeatureGateCard>
    ),
};
