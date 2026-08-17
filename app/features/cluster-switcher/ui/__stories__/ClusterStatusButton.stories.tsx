import { withClusterState } from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus, DEVNET_URL, MAINNET_BETA_URL, TESTNET_URL } from '@utils/cluster';
import { expect, within } from 'storybook/test';

import { ClusterStatusButton } from '../ClusterStatusButton';

// A long custom RPC endpoint (the case that used to make the navbar button overflow and wrap).
const CUSTOM_RPC_URL = 'https://random-helius-fast-mainnet.helius-rpc.com';
const LOCALHOST_URL = 'http://localhost:3000';

// Fixes wrapper width for truncation tests.
const WRAPPER_WIDTH_PX = 210;

// Wrap with fixed width so truncation is observable outside of a full Navbar.
const withWrapperWidth: Decorator = Story => (
    <div style={{ maxWidth: `${WRAPPER_WIDTH_PX}px` }}>
        <Story />
    </div>
);

const meta = {
    component: ClusterStatusButton,
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/ClusterStatusButton',
} satisfies Meta<typeof ClusterStatusButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainnetBeta: Story = {
    decorators: [
        withClusterState({
            cluster: Cluster.MainnetBeta,
            customUrl: MAINNET_BETA_URL,
            status: ClusterStatus.Connected,
        }),
    ],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByText('Mainnet Beta')).toBeInTheDocument();
    },
};

export const Devnet: Story = {
    decorators: [withClusterState({ cluster: Cluster.Devnet, customUrl: DEVNET_URL, status: ClusterStatus.Connected })],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByText('Devnet')).toBeInTheDocument();
    },
};

export const Testnet: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.Testnet, customUrl: TESTNET_URL, status: ClusterStatus.Connected }),
    ],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByText('Testnet')).toBeInTheDocument();
    },
};

export const CustomUrlTruncated: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_RPC_URL, status: ClusterStatus.Connected }),
        withWrapperWidth,
    ],
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByText(CUSTOM_RPC_URL);
        const style = getComputedStyle(button);

        // `truncate` class is overflow-hidden + text-ellipsis + whitespace-nowrap
        expect(style.overflowX).toBe('hidden');
        expect(style.textOverflow).toBe('ellipsis');
        expect(style.whiteSpace).toBe('nowrap');

        // The URL really is clipped: content is wider than the box, and the box stays within the navbar slot.
        expect(button.scrollWidth).toBeGreaterThan(button.clientWidth);
        expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(WRAPPER_WIDTH_PX);
    },
};

export const CustomLocalhost: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: LOCALHOST_URL, status: ClusterStatus.Connected }),
    ],
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByText(LOCALHOST_URL)).toBeInTheDocument();
    },
};

export const Connecting: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_RPC_URL, status: ClusterStatus.Connecting }),
    ],
};

export const Failure: Story = {
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_RPC_URL, status: ClusterStatus.Failure }),
    ],
};
