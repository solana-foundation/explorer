import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster } from '@utils/cluster';

import { type AlpenglowUpgrade } from '../../lib/genesis-cert';
import { BaseAlpenglowCard } from '../BaseAlpenglowCard';

const MIGRATED: AlpenglowUpgrade = {
    cert: { blockId: 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn', slot: 460_012_345n },
    kind: 'migrated',
};

const meta = {
    component: BaseAlpenglowCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Alpenglow/AlpenglowCard',
} satisfies Meta<typeof BaseAlpenglowCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every cluster before the migration: the node answers, and has no certificate to show. */
export const Pending: Story = {
    args: { cluster: Cluster.MainnetBeta, upgrade: { kind: 'pending' } },
};

export const Migrated: Story = {
    args: { cluster: Cluster.MainnetBeta, upgrade: MIGRATED },
};

export const MigratedOnDevnet: Story = {
    args: { cluster: Cluster.Devnet, upgrade: MIGRATED },
};
