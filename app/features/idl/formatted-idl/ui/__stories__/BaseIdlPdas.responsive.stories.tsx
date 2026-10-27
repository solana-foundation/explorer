import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlPdas } from '../BaseIdlPdas';
import * as Base from './BaseIdlPdas.stories';

const meta: Meta<typeof BaseIdlPdas> = {
    component: BaseIdlPdas,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlPdas@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.PdasWithSeeds.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
