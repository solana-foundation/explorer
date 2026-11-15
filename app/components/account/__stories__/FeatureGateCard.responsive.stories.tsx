import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { FeatureGateCard } from '../FeatureGateCard';
import { FeatureGateMarkdown } from '../FeatureGateMarkdown';
import { SIMD_0266_MARKDOWN, SIMD_0266_URL } from './feature-gate-fixtures';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof FeatureGateCard> = {
    args: {
        children: <FeatureGateMarkdown baseUrl={SIMD_0266_URL}>{SIMD_0266_MARKDOWN}</FeatureGateMarkdown>,
    },
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

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
