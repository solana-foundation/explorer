import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import type { Decorator } from '@storybook/react';
import { createNextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { SWRConfig, unstable_serialize } from 'swr';

import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { Cluster } from '@/app/utils/cluster';

import { ProgramMultisigCard } from '../ProgramMultisigCard';

// Devnet cluster short-circuits the Squads lookups (return null on non-mainnet). Seed the SWR
// cache for both suspenseful keys so they resolve synchronously — otherwise the "Loading multisig
// information" Suspense fallback can win the screenshot race before the microtask settles.
const withSquadsFallback: Decorator = Story => (
    <SWRConfig
        value={{
            fallback: {
                [unstable_serialize(['squadsReverseMap', PublicKey.default.toString(), Cluster.Devnet])]: null,
                [unstable_serialize(['squadsMultisig', undefined, Cluster.Devnet])]: null,
            },
        }}
    >
        <Story />
    </SWRConfig>
);

const meta = {
    component: ProgramMultisigCard,
    decorators: [withSquadsFallback, withClusterAndAccounts, withTokenInfoBatch],
    parameters: createNextjsParameters({ query: { cluster: 'devnet' } }),
    tags: ['autodocs', 'test'],
    title: 'Components/Account/ProgramMultisigCard',
} satisfies Meta<typeof ProgramMultisigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: {
            parsed: {
                info: { programData: PublicKey.default },
                type: 'program',
            },
            program: 'bpf-upgradeable-loader',
            programData: {
                authority: PublicKey.default,
                data: ['', 'base64'],
                slot: 312_000_000,
            },
        } satisfies UpgradeableLoaderAccountData,
    },
};
