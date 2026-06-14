import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { Cluster } from '@utils/cluster';

import type { ActivatedFeature } from '../../lib/partition-features';
import { EmptyStateCard, FeatureGateTable } from '../FeatureGateTable';

const baseFields = {
    comms_required: null,
    description: 'Activates a new behavior on the network. Click the row to expand the full description.',
    devnet_activation_epoch: 700,
    mainnet_activation_epoch: 850,
    min_agave_versions: ['1.18.0'],
    min_fd_versions: [],
    min_jito_versions: [],
    owners: ['Solana Labs'],
    planned_testnet_order: null,
    testnet_activation_epoch: 680,
};

const activated: ActivatedFeature[] = [
    {
        ...baseFields,
        clusterActivationEpoch: 850,
        key: address(gen.address(1)),
        otherActivations: [{ cluster: Cluster.Devnet, epoch: 700 }],
        simdEntries: [{ link: 'https://github.com/example', simd: '148' }],
        title: 'MoveStake and MoveLamports',
    },
];

const meta: Meta<typeof FeatureGateTable<ActivatedFeature>> = {
    component: FeatureGateTable<ActivatedFeature>,
    decorators: [withViewportFromGlobal],
    parameters: {
        layout: 'padded',
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/FeatureGateTable/Responsive',
};

export default meta;
type Story = StoryObj<typeof FeatureGateTable<ActivatedFeature>>;

const args = {
    cluster: Cluster.MainnetBeta,
    emptyState: <EmptyStateCard>No activated features.</EmptyStateCard>,
    features: activated,
    secondColumn: {
        header: 'Activation',
        render: (feature: ActivatedFeature) => <span>{feature.clusterActivationEpoch}</span>,
    },
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
