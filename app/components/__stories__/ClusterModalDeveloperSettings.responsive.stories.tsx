import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import ClusterModalDeveloperSettings from '../ClusterModalDeveloperSettings';

const meta = {
    component: ClusterModalDeveloperSettings,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/ClusterModalDeveloperSettings@Media',
} satisfies Meta<typeof ClusterModalDeveloperSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = { globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { globals: { viewport: { isRotated: true, value: 'ipad' } } };
