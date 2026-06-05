import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterModalOpen } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React from 'react';

import { ClusterModal } from '../ClusterModal';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: ClusterModal,
    decorators: [
        Story => (
            <JotaiProvider store={createStore()}>
                <Story />
            </JotaiProvider>
        ),
        withClusterModalOpen,
        withViewportFromGlobal,
    ],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/ClusterModal/Responsive',
} satisfies Meta<typeof ClusterModal>;

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
