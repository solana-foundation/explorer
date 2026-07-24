import { nextjsParameters, withCluster, withClusterState } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';

import { Navbar } from '../Navbar';

const meta = {
    component: Navbar,
    decorators: [withCluster],
    parameters: {
        ...nextjsParameters,
        // Logo + navbar drawer need vertical room; pin the docs canvas so the full row is visible.
        docs: { story: { height: '80px' } },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Navbar',
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithChildren: Story = {
    args: {
        children: <div className="text-dk-gray-700">Page-level slot content (e.g., breadcrumbs)</div>,
    },
};

export const WithCustomRpcUrl: Story = {
    decorators: [
        withClusterState({
            cluster: Cluster.Custom,
            customUrl: 'https://random-helius-fast-mainnet.helius-rpc.com',
            status: ClusterStatus.Connected,
        }),
    ],
};
