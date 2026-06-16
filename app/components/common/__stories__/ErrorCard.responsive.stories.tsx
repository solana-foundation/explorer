import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { ErrorCard } from '../ErrorCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
// ErrorCard switches button layout under the md breakpoint (full-width on mobile, inline on md+).
const meta: Meta<typeof ErrorCard> = {
    component: ErrorCard,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/ErrorCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    retry: () => {},
    subtext: 'Please check your network connection',
    text: 'Failed to fetch',
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
