import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { FeatureGateCard } from '../FeatureGateCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof FeatureGateCard> = {
    component: FeatureGateCard,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureGateCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => (
    <FeatureGateCard>
        This feature gate controls the activation of cluster-level functionality. Activate it to enable the new
        behaviour cluster-wide.
    </FeatureGateCard>
);

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};
