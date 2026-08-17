import { createNextjsParameters, withClusterState } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { expect, within } from 'storybook/test';

import type { SavedCluster } from '../../lib/cluster-storage';
import { SavedClusterList } from '../SavedClusterList';
import { withSavedClusters, withSwitcherPanel } from './switcher-panel';

const STAGING_URL = 'https://staging.example.com/rpc?api-key=not-a-real-key';

// What the list has to survive: a plain entry, an endpoint whose key lives in the query and must not
// reach the visible line, and a name long enough to truncate over a host that also truncates.
const SAVED: SavedCluster[] = [
    { name: 'My Local', url: 'http://localhost:8899' },
    { name: 'Staging', url: STAGING_URL },
    {
        name: 'A cluster name long enough to truncate',
        url: 'https://a-deliberately-long-hostname.rpc.provider.example.com:8899',
    },
];

const meta = {
    component: SavedClusterList,
    decorators: [withSwitcherPanel],
    parameters: { ...createNextjsParameters() },
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/SavedClusterList',
} satisfies Meta<typeof SavedClusterList>;

export default meta;
type Story = StoryObj<typeof meta>;

// From another cluster: nothing selected, every entry a way back to an endpoint.
export const Several: Story = {
    args: { savedClusters: SAVED, status: ClusterStatus.Connected },
    decorators: [
        withClusterState({ cluster: Cluster.MainnetBeta, status: ClusterStatus.Connected }),
        withSavedClusters(SAVED),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The name alone cannot tell two entries, or a stale entry from a good one, apart. The key stays
        // out of it; the whole URL is on the title.
        expect(canvas.getByTestId('saved-cluster-host-Staging')).toHaveTextContent('staging.example.com');
        expect(canvas.getByTestId('saved-cluster-host-Staging')).not.toHaveTextContent('api-key');
        expect(canvas.getByTestId('saved-cluster-link-Staging')).toHaveAttribute('title', `Staging — ${STAGING_URL}`);
    },
};

// The only cue that a saved entry is the endpoint in use.
export const Selected: Story = {
    args: { savedClusters: SAVED, status: ClusterStatus.Connected },
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: STAGING_URL, status: ClusterStatus.Connected }),
        withSavedClusters(SAVED),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const selected = canvas.getByTestId('saved-cluster-link-Staging');
        const other = canvas.getByTestId('saved-cluster-link-My Local');

        // Against a sibling rather than a literal color, so this asserts "it stands out" and not which
        // green the status happens to use.
        expect(getComputedStyle(selected).borderColor).not.toBe(getComputedStyle(other).borderColor);
    },
};

// The selected entry cannot be reached: the node is down, the tunnel closed, or the key was rotated.
export const SelectedUnreachable: Story = {
    args: { savedClusters: SAVED, status: ClusterStatus.Failure },
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: STAGING_URL, status: ClusterStatus.Failure }),
        withSavedClusters(SAVED),
    ],
};

// One entry, so the delete button can be looked at on its own. It sits on the pill rather than beside it.
export const SingleEntry: Story = {
    args: { savedClusters: [SAVED[0]], status: ClusterStatus.Connected },
    decorators: [
        withClusterState({ cluster: Cluster.MainnetBeta, status: ClusterStatus.Connected }),
        withSavedClusters([SAVED[0]]),
    ],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByLabelText('Delete My Local')).toBeInTheDocument();
    },
};
