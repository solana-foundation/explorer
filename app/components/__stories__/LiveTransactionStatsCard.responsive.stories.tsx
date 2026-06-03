import type { Meta, StoryObj } from '@storybook/react';
import {
    nextjsParameters,
    responsiveDocsPage,
    withMockRpc,
    withStats,
    withViewportFromGlobal,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { LiveTransactionStatsCard } from '../LiveTransactionStatsCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof LiveTransactionStatsCard> = {
    component: LiveTransactionStatsCard,
    decorators: [withMockRpc, withViewportFromGlobal, withStats],
    parameters: {
        ...nextjsParameters,
        docs: { page: responsiveDocsPage },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs'],
    title: 'Components/LiveTransactionStatsCard/Responsive',
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
