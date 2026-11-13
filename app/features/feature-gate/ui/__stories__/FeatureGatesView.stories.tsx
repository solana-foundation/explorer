import { toConnectableUrl } from '@entities/cluster';
import { defaultEpochInfo, MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import { Cluster, clusterSelection, clusterUrl } from '@utils/cluster';
import { expect, within } from 'storybook/test';
import { SWRConfig, unstable_serialize } from 'swr';

import { FeatureGatesView } from '../FeatureGatesView';

// These stories set the current epoch themselves: the mock cluster's default predates every mainnet activation,
// which would give each one a countdown. The slot time is seeded so an epoch still ahead shows its countdown
// without a network call, and revalidation is off so a poll does not replace the seeded epoch (epoch info polls
// to stay live).
function atEpoch(epoch: bigint): Decorator {
    return function AtEpoch(Story) {
        return (
            <MockClusterProvider
                clusterInfo={{
                    epochInfo: { ...defaultEpochInfo, epoch },
                    epochSchedule: { firstNormalEpoch: 14n, firstNormalSlot: 524_256n, slotsPerEpoch: 432_000n },
                }}
            >
                <SWRConfig
                    value={{
                        fallback: { [SLOT_TIME_KEY]: 400 },
                        revalidateIfStale: false,
                        revalidateOnMount: false,
                        revalidateOnReconnect: false,
                    }}
                >
                    <Story />
                </SWRConfig>
            </MockClusterProvider>
        );
    };
}

const SLOT_TIME_KEY = unstable_serialize([
    'slot-time',
    Cluster.MainnetBeta,
    toConnectableUrl(clusterUrl(clusterSelection(Cluster.MainnetBeta))),
]);

const meta: Meta<typeof FeatureGatesView> = {
    component: FeatureGatesView,
    decorators: [atEpoch(1075n)],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/FeatureGatesView',
};

export default meta;
type Story = StoryObj<typeof meta>;

const startsWith = (title: string) => (name: string) => name.startsWith(title);

// The features on this cluster sit under Activated, those still to come here under Upcoming; there is no other section.
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('heading', { level: 2, name: startsWith('Upcoming') })).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { level: 2, name: startsWith('Planned') })).not.toBeInTheDocument();
        expect(canvas.getByRole('heading', { level: 2, name: startsWith('Activated') })).toBeInTheDocument();
        expect(canvas.queryByRole('tab')).not.toBeInTheDocument();
    },
};

// Epoch 1060: an activation epoch still ahead shows its countdown, at the size of the cluster label above it.
export const WithCountdown: Story = {
    decorators: [atEpoch(1060n)],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const [label] = canvas.getAllByText(content => content.startsWith('Mainnet Beta:'));
        const [countdown] = canvas.getAllByText(content => content.startsWith('in ~'));
        expect(getComputedStyle(countdown).fontSize).toBe(getComputedStyle(label).fontSize);
    },
};
