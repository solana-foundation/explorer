import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { Ed25519DetailsCard } from '../Ed25519DetailsCard';
import * as Base from './Ed25519DetailsCard.stories';

const meta: Meta<typeof Ed25519DetailsCard> = {
    component: Ed25519DetailsCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/Ed25519DetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.SingleSignature.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
