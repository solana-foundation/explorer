import { withClusterState } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster, ClusterStatus } from '@utils/cluster';

import { ClusterStatusButton } from '../ClusterStatusButton';

const CUSTOM_RPC_URL = 'https://random-helius-fast-mainnet.helius-rpc.com';

const meta = {
    component: ClusterStatusButton,
    decorators: [
        withClusterState({ cluster: Cluster.Custom, customUrl: CUSTOM_RPC_URL, status: ClusterStatus.Connected }),
        withViewportFromGlobal,
    ],
    parameters: {
        docs: { story: { height: INITIAL_VIEWPORTS.iphonex.styles.height } },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/ClusterStatusButton@Media',
} satisfies Meta<typeof ClusterStatusButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
};
