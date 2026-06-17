import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { SimulatorCard } from '../SimulationCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const idleMessage = mockVersionedMessage({
    serialize: () => new Uint8Array(),
});

const meta = {
    component: SimulatorCard,
    decorators: [withViewportFromGlobal, withCluster],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionSimulation/SimulationCard@Media',
} satisfies Meta<typeof SimulatorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    message: idleMessage,
    showTokenBalanceChanges: false,
};

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
