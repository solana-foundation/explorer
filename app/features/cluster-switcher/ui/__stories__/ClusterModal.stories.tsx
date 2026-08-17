import { useClusterModal } from '@entities/cluster';
import {
    createNextjsParameters,
    nextjsParameters,
    withClusterModalOpen,
    withClusterState,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React from 'react';
import { expect, within } from 'storybook/test';

import type { SavedCluster } from '../../lib/cluster-storage';
import { ClusterModal } from '../ClusterModal';
import { withSavedClusters } from './switcher-panel';

const CUSTOM_URL = 'https://my-node.example/rpc?api-key=not-a-real-key';

// What the two-line saved pill has to survive: a plain entry, an endpoint whose key lives in the query
// and must not reach the visible line, and a name long enough to truncate over a host that also truncates.
const SAVED: SavedCluster[] = [
    { name: 'My Local', url: 'http://localhost:8899' },
    { name: 'Staging', url: 'https://staging.example.com/rpc?api-key=not-a-real-key' },
    {
        name: 'A cluster name long enough to truncate',
        url: 'https://a-deliberately-long-hostname.rpc.provider.example.com:8899',
    },
];

// Wraps the modal with a re-open button so the story stays interactive after the modal is dismissed.
function ClusterModalWithReopen() {
    const [, setShow] = useClusterModal();
    return (
        <>
            <button type="button" onClick={() => setShow(true)}>
                Open ClusterModal
            </button>
            <ClusterModal />
        </>
    );
}

// `withClusterModalOpen` seeds the cluster-modal atom to `true` so the modal renders. A fresh jotai store
// per story keeps that and savedClusters isolated; stories bringing their own store seed the atom through
// `withClusterState({ modalOpen: true })` instead, since the store has to sit outside the provider that
// seeds it. Docs canvas height uses ipad portrait so the full modal fits without scrolling.
const meta = {
    component: ClusterModal,
    decorators: [withClusterModalOpen, withSavedClusters([])],
    parameters: {
        ...nextjsParameters,
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/ClusterModal',
} satisfies Meta<typeof ClusterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <ClusterModalWithReopen />,
};

// Neither line of the saved pill is reachable from `Default`, which starts with empty storage.
export const WithSavedClusters: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.MainnetBeta, modalOpen: true, status: ClusterStatus.Connected }),
        withSavedClusters(SAVED),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByTestId('saved-clusters-section')).toBeVisible();
        expect(canvas.getByTestId('saved-cluster-host-Staging')).toHaveTextContent('staging.example.com');
    },
    render: () => <ClusterModalWithReopen />,
};

// Custom is the only cluster where the endpoint field, the save control and a selected saved entry exist
// at all. `Default` sits on Mainnet and shows none of it.
export const CustomCluster: Story = {
    decorators: [
        withClusterState({
            cluster: Cluster.Custom,
            customUrl: CUSTOM_URL,
            modalOpen: true,
            status: ClusterStatus.Connected,
        }),
        withSavedClusters(SAVED),
    ],
    parameters: {
        ...createNextjsParameters({ query: { cluster: 'custom', customUrl: CUSTOM_URL } }),
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The endpoint is not one of the saved ones, so the offer to keep it stands.
        expect(canvas.getByLabelText('Custom RPC URL')).toHaveValue(CUSTOM_URL);
        expect(canvas.getByTestId('save-custom-cluster-btn')).toBeVisible();
    },
    render: () => <ClusterModalWithReopen />,
};

// The endpoint is already kept under a name, so the save control gives way and that entry is selected.
export const CustomClusterSaved: Story = {
    decorators: [
        withClusterState({
            cluster: Cluster.Custom,
            customUrl: SAVED[0].url,
            modalOpen: true,
            status: ClusterStatus.Connected,
        }),
        withSavedClusters(SAVED),
    ],
    parameters: {
        ...createNextjsParameters({ query: { cluster: 'custom', customUrl: SAVED[0].url } }),
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByLabelText('Custom RPC URL')).toHaveValue(SAVED[0].url);
        expect(canvas.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    },
    render: () => <ClusterModalWithReopen />,
};
