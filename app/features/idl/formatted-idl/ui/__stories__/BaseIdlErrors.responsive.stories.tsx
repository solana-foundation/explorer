import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlErrors } from '../BaseIdlErrors';
import * as Base from './BaseIdlErrors.stories';

const meta: Meta<typeof BaseIdlErrors> = {
    component: BaseIdlErrors,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlErrors@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.BasicErrors.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
