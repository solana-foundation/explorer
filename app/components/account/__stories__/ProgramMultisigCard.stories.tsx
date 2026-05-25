import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { createNextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';

import { ProgramMultisigCard } from '../ProgramMultisigCard';

// Devnet cluster short-circuits useSquadsMultisigLookup (returns null immediately) so
// the Suspense boundary resolves without firing a real Squads RPC call. Renders the
// inner card with empty multisig info.
const meta = {
    component: ProgramMultisigCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: createNextjsParameters({ query: { cluster: 'devnet' } }),
    tags: ['autodocs'],
    title: 'Components/Account/ProgramMultisigCard',
} satisfies Meta<typeof ProgramMultisigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: {
            programData: {
                authority: new PublicKey('11111111111111111111111111111111'),
                data: new Uint8Array(),
                slot: 312_000_000,
            },
        } as any,
    },
};
