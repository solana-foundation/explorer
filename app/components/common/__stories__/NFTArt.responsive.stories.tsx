import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import * as Base from './NFTArt.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Common/NFTArt@Media',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render: Base.WithUri.render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render: Base.WithUri.render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: Base.WithUri.render,
};
