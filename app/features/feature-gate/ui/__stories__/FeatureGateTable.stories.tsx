import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster } from '@utils/cluster';
import { expect, fn, within } from 'storybook/test';

import type { ActivatedFeature, UpcomingFeature } from '../../lib/partition-features';
import { EmptyStateCard, FeatureGateTable, OtherActivationsCell, ShowMoreButton } from '../FeatureGateTable';

const featureKey = (seed: number) => address(gen.address(seed));

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
        key: featureKey(1),
        otherActivations: [
            { cluster: Cluster.Devnet, epoch: 700 },
            { cluster: Cluster.Testnet, epoch: 680 },
        ],
        simdEntries: [
            { link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/148', simd: '148' },
        ],
        title: 'MoveStake and MoveLamports',
    },
    {
        ...baseFields,
        clusterActivationEpoch: 820,
        description: null,
        key: featureKey(2),
        otherActivations: [],
        simdEntries: [],
        title: 'Feature without description or SIMDs',
    },
];

const upcoming: UpcomingFeature[] = [
    {
        ...baseFields,
        description: 'Pending activation on mainnet — active on devnet and testnet.',
        key: address(PublicKey.default.toBase58()),
        otherActivations: [
            { cluster: Cluster.Devnet, epoch: 750 },
            { cluster: Cluster.Testnet, epoch: 720 },
        ],
        simdEntries: [
            { link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/123', simd: '123' },
        ],
        title: 'Upcoming Feature Gate',
    },
];

const meta: Meta<typeof FeatureGateTable<ActivatedFeature>> = {
    component: FeatureGateTable<ActivatedFeature>,
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/FeatureGateTable',
};

export default meta;
type Story = StoryObj<typeof FeatureGateTable<ActivatedFeature>>;

const activatedArgs = {
    cluster: Cluster.MainnetBeta,
    emptyState: <EmptyStateCard>No activated features.</EmptyStateCard>,
    features: activated,
    secondColumn: {
        header: 'Activation',
        render: (feature: ActivatedFeature) => <span>{feature.clusterActivationEpoch}</span>,
    },
};

const upcomingArgs = {
    cluster: Cluster.MainnetBeta,
    emptyState: <EmptyStateCard>No upcoming features.</EmptyStateCard>,
    features: upcoming,
    secondColumn: {
        header: 'Activation',
        render: (feature: UpcomingFeature) => <OtherActivationsCell activations={feature.otherActivations} />,
    },
};

export const ActivatedRows: Story = {
    args: activatedArgs,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(baseFields.description, { exact: false })).toBeInTheDocument();
    },
};

// The Activated section's header: a sort toggle with the direction shown by the chevrons.
export const SortableActivation: Story = {
    args: {
        ...activatedArgs,
        secondColumn: { ...activatedArgs.secondColumn, sort: { direction: 'desc', onToggle: fn() } },
    },
};

// The Upcoming section folded to its first rows, with the button that shows the rest.
export const WithFooter: StoryObj<typeof FeatureGateTable<UpcomingFeature>> = {
    args: {
        ...upcomingArgs,
        footer: <ShowMoreButton hiddenCount={8} onClick={fn()} />,
    },
};

export const UpcomingRows: StoryObj<typeof FeatureGateTable<UpcomingFeature>> = {
    args: upcomingArgs,
};

export const Empty: Story = {
    args: {
        ...activatedArgs,
        emptyState: <EmptyStateCard>No activated features on this cluster.</EmptyStateCard>,
        features: [],
    },
};
