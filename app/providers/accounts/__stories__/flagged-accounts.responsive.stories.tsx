import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import FLAGGED_ACCOUNTS_WARNING from '../flagged-accounts';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Providers/Accounts/FlaggedAccountWarnings/Responsive',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const renderFtx = () => FLAGGED_ACCOUNTS_WARNING['22Y43yTVxuUkoRKdm9thyRhQ3SdgQS7c7kB6UNCiaczD'];

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render: renderFtx,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render: renderFtx,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: renderFtx,
};
