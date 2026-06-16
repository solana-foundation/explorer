import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { fn } from 'storybook/test';

import { RawInput } from '../RawInputCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: RawInput,
    decorators: [withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/RawInputCard@Media',
} satisfies Meta<typeof RawInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { setTransactionData: fn() };

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
