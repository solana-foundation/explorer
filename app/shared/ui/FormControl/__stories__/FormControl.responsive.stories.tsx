import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { FormControl } from '../FormControl';
import * as Base from './FormControl.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof FormControl> = {
    component: FormControl,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Shared/FormControl@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithChildClassName.args;

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
