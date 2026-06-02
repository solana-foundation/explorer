import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';

import { VerifiedBuildCard } from '../VerifiedBuildCard';

const PUBKEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// When data.programData is undefined the card renders the "Account has no data" ErrorCard
// path immediately — no Suspense / SWR work needed. The populated verified-build visual
// requires a live osec.io registry response and is left as a follow-up.
const meta = {
    component: VerifiedBuildCard,
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/VerifiedBuildCard',
} satisfies Meta<typeof VerifiedBuildCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoProgramData: Story = {
    args: {
        data: { programData: undefined } as any,
        pubkey: PUBKEY,
    },
};
