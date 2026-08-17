import { useClusterModal } from '@entities/cluster';
import {
    createNextjsParameters,
    nextjsParameters,
    withClusterModalOpen,
    withClusterState,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React from 'react';

import type { SavedCluster } from '../../lib/cluster-storage';
import { ClusterModal } from '../ClusterModal';
import { withSavedClusters } from './switcher-panel';

const CUSTOM_URL = 'https://my-node.example/rpc?api-key=not-a-real-key';

const SAVED: SavedCluster[] = [
    { name: 'My Local', url: 'http://localhost:8899' },
    { name: 'Staging', url: 'https://staging.example.com/rpc?api-key=not-a-real-key' },
    {
        name: 'A cluster name long enough to truncate',
        url: 'https://a-deliberately-long-hostname.rpc.provider.example.com:8899',
    },
];

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

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: ClusterModal,
    decorators: [withClusterModalOpen, withSavedClusters([]), withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/ClusterModal@Media',
} satisfies Meta<typeof ClusterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => <ClusterModalWithReopen />;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};

// The tallest the panel gets, on the shortest viewport: the case the scrolling body exists for, since
// the developer settings at the bottom stay reachable only because the body scrolls.
export const MobileCustomCluster: Story = {
    decorators: [
        withClusterState({
            cluster: Cluster.Custom,
            customUrl: CUSTOM_URL,
            modalOpen: true,
            status: ClusterStatus.Connected,
        }),
        withSavedClusters(SAVED),
    ],
    globals: { viewport: { value: 'iphonex' } },
    parameters: {
        ...createNextjsParameters({ query: { cluster: 'custom', customUrl: CUSTOM_URL } }),
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    render,
};
