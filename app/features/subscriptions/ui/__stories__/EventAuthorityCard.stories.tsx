import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { SubscriptionsEventAuthorityCard } from '../EventAuthorityCard';

// The event-authority PDA is System-owned / unallocated on-chain, so the story models
// the synthesized "does not exist" account shape the explorer builds for it.
const account: Account = {
    data: { raw: new Uint8Array() },
    executable: false,
    lamports: 0,
    owner: toLegacyPublicKey(address('11111111111111111111111111111111')),
    pubkey: gen.publicKey(0),
    space: 0,
};

const meta = {
    component: SubscriptionsEventAuthorityCard,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/EventAuthorityCard',
} satisfies Meta<typeof SubscriptionsEventAuthorityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { account },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Subscriptions Event Authority')).toBeInTheDocument();
        expect(canvas.getByText('Event Authority (signer PDA)')).toBeInTheDocument();
    },
};
