import { DEFAULT_RPC_ENDPOINT } from '@entities/cluster';
import { createNextjsParameters, withClusterState } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { expect, within } from 'storybook/test';

import { CustomClusterField } from '../CustomClusterField';
import { withSavedClusters, withSwitcherPanel } from './switcher-panel';

const CUSTOM_URL = 'https://my-node.example/rpc?api-key=not-a-real-key';

// The field renders on the Custom cluster and nowhere else, so the modal on Mainnet shows none of these
// states. `customUrl` on the decorator is what `useCustomUrlDraft` puts in the field; the query param is
// what the pill's href is built from. Both are set, so the story matches a real page.
const meta = {
    component: CustomClusterField,
    decorators: [withSwitcherPanel],
    parameters: {
        ...createNextjsParameters({ query: { cluster: 'custom', customUrl: CUSTOM_URL } }),
    },
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/CustomClusterField',
} satisfies Meta<typeof CustomClusterField>;

export default meta;
type Story = StoryObj<typeof meta>;

// Off the Custom cluster there is nothing but the pill.
export const NotSelected: Story = {
    args: { active: false, savedClusters: [], status: ClusterStatus.Connected },
    decorators: [withClusterState({ cluster: Cluster.Devnet, status: ClusterStatus.Connected }), withSavedClusters([])],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Custom RPC URL')).toBeInTheDocument();
        expect(canvas.queryByLabelText('Custom RPC URL')).not.toBeInTheDocument();
    },
};

// The default state of the field: the endpoint the app resolved, and the offer to keep it.
export const Selected: Story = {
    args: { active: true, savedClusters: [], status: ClusterStatus.Connected },
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_URL, status: ClusterStatus.Connected }),
        withSavedClusters([]),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The field starts on the endpoint the app is using — the contract of `useCustomUrlDraft`.
        expect(canvas.getByLabelText('Custom RPC URL')).toHaveValue(CUSTOM_URL);
        expect(canvas.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    },
};

// Straight after the Custom pill is clicked, with no `customUrl` in the query. The reader falls back to
// the default endpoint, so the field is filled before the user has chosen anything — and nothing offers
// to name a choice they never made.
export const JustSelected: Story = {
    args: { active: true, savedClusters: [], status: ClusterStatus.Connected },
    decorators: [withClusterState({ cluster: Cluster.Custom, status: ClusterStatus.Connected }), withSavedClusters([])],
    parameters: { ...createNextjsParameters({ query: { cluster: 'custom' } }) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByLabelText('Custom RPC URL')).toHaveValue(DEFAULT_RPC_ENDPOINT.href);
        expect(canvas.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    },
};

// Already kept under a name, so there is nothing left to offer.
export const AlreadySaved: Story = {
    args: {
        active: true,
        savedClusters: [{ name: 'My Node', url: CUSTOM_URL }],
        status: ClusterStatus.Connected,
    },
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_URL, status: ClusterStatus.Connected }),
        withSavedClusters([{ name: 'My Node', url: CUSTOM_URL }]),
    ],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    },
};

// An endpoint the app cannot reach — a typo, a node that is down, a tunnel that closed. The pill's color
// is the only report of it.
export const Unreachable: Story = {
    args: { active: true, savedClusters: [], status: ClusterStatus.Failure },
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_URL, status: ClusterStatus.Failure }),
        withSavedClusters([]),
    ],
};
