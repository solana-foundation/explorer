import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';

import { AddressWithContext, createFeePayerValidator, programValidator } from '../AddressWithContext';

const meta = {
    component: AddressWithContext,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/AddressWithContext',
} satisfies Meta<typeof AddressWithContext>;

export default meta;
type Story = StoryObj<typeof meta>;

// No accounts fetcher in stories → all variants render the "Loading" placeholder. The validator
// branch only fires once the fetch resolves, so these stories exercise the loading + render shell.
export const Loading: Story = {
    args: {
        pubkey: PublicKey.unique(),
    },
};

export const HideInfo: Story = {
    args: {
        hideInfo: true,
        pubkey: PublicKey.unique(),
    },
};

export const WithFeePayerValidator: Story = {
    args: {
        pubkey: PublicKey.unique(),
        validator: createFeePayerValidator(5000),
    },
};

export const WithProgramValidator: Story = {
    args: {
        pubkey: PublicKey.unique(),
        validator: programValidator,
    },
};
