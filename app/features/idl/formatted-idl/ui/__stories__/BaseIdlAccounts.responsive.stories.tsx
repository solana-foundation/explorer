import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlAccounts } from '../BaseIdlAccounts';
import * as Base from './BaseIdlAccounts.stories';

const meta: Meta<typeof BaseIdlAccounts> = {
    component: BaseIdlAccounts,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlAccounts@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.SimpleAccounts.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
