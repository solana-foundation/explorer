import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlTypes } from '../BaseIdlTypes';
import * as Base from './BaseIdlTypes.stories';

const meta: Meta<typeof BaseIdlTypes> = {
    component: BaseIdlTypes,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlTypes@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.StructTypes.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
