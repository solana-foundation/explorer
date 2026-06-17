import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { Navbar } from '../Navbar';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: Navbar,
    decorators: [withCluster, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        docs: { story: { height: '120px' } },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Navbar@Media',
} satisfies Meta<typeof Navbar>;

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
