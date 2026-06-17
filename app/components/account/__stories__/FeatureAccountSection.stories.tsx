import { gen } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';

import { FeatureAccountSection } from '../FeatureAccountSection';

const meta = {
    component: FeatureAccountSection,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureAccountSection',
} satisfies Meta<typeof FeatureAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Random pubkey that won't match any known feature gate; ErrorBoundary falls back to UnknownAccountCard
// when isFeature parsing fails on the empty account body.
const unknownAccount = {
    data: {},
    executable: false,
    lamports: 1_000_000_000,
    owner: PublicKey.default,
    pubkey: gen.publicKey(1),
    space: 9,
};

export const UnknownFeatureAccount: Story = {
    args: {
        account: unknownAccount,
    },
};
