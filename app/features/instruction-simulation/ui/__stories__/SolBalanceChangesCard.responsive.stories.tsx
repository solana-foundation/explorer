import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SolBalanceChangesCard } from '../SolBalanceChangesCard';
import * as Base from './SolBalanceChangesCard.stories';

const meta: Meta<typeof SolBalanceChangesCard> = {
    component: SolBalanceChangesCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionSimulation/SolBalanceChangesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.MultipleChanges.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
