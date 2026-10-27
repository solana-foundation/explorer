import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import * as Base from './Tabs.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta = {
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Shared/Tabs@Media',
};

export default meta;
type Story = StoryObj;

const { render } = Base.Default;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};
