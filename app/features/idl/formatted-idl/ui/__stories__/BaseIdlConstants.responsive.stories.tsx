import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlConstants } from '../BaseIdlConstants';
import * as Base from './BaseIdlConstants.stories';

const meta: Meta<typeof BaseIdlConstants> = {
    component: BaseIdlConstants,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlConstants@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.NumericConstants.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
