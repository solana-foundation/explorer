import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlEvents } from '../BaseIdlEvents';
import * as Base from './BaseIdlEvents.stories';

const meta: Meta<typeof BaseIdlEvents> = {
    component: BaseIdlEvents,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlEvents@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.BasicEvents.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
