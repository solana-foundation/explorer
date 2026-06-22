import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { InfoTooltip } from '../InfoTooltip';

const meta: Meta<typeof InfoTooltip> = {
    component: InfoTooltip,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InfoTooltip@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    children: <span>Hover for more info</span>,
    text: 'This is the tooltip text shown on hover.',
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
