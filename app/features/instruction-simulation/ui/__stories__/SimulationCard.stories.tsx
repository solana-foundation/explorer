import type { Meta, StoryObj } from '@storybook/react';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { SimulatorCard } from '../SimulationCard';

// useSimulation calls message.serialize() to build a fingerprint cache key — stub it so the
// fake message satisfies the contract without constructing a real serializable transaction.
const idleMessage = mockVersionedMessage({
    serialize: () => new Uint8Array(),
});

const meta = {
    component: SimulatorCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionSimulation/SimulationCard',
} satisfies Meta<typeof SimulatorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// `useSimulation` is SWR-mutation based — the card stays in idle state until the user clicks Simulate.
export const Idle: Story = {
    args: {
        message: idleMessage,
        showTokenBalanceChanges: false,
    },
};
