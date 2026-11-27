import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SimulatorCard } from '../SimulationCard';
import * as Base from './SimulationCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: SimulatorCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionSimulation/SimulationCard@Media',
} satisfies Meta<typeof SimulatorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Idle.args;

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
