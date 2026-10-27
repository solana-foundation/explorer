import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlInstructions } from '../BaseIdlInstructions';
import * as Base from './BaseIdlInstructions.stories';

const meta: Meta<typeof BaseIdlInstructions> = {
    component: BaseIdlInstructions,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlInstructions@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.SimpleInstructions.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
