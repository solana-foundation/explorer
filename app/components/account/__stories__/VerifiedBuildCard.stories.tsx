import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';

import { VerifiedBuildCard } from '../VerifiedBuildCard';

const PUBKEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// When data.programData is undefined the card renders the "Account has no data" ErrorCard
// path immediately — no Suspense / SWR work needed. The populated visual is exercised by
// `Verified`, which relies on `.storybook/__mocks__/verified-builds.tsx` to stub
// useVerifiedProgram (real impl would hit verify.osec.io + a Solana RPC PDA fetch).
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

export const Verified: Story = {
    args: {
        data: {
            programData: {
                authority: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
                data: ['', 'base64'],
                slot: 0,
            },
        } as any,
        pubkey: PUBKEY,
    },
};
