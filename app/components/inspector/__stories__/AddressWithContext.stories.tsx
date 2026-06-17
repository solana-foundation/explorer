import { gen } from '@__fixtures__/gen';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
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
        pubkey: gen.publicKey(1),
    },
};

export const HideInfo: Story = {
    args: {
        hideInfo: true,
        pubkey: gen.publicKey(2),
    },
};

export const WithFeePayerValidator: Story = {
    args: {
        pubkey: gen.publicKey(3),
        validator: createFeePayerValidator(5000),
    },
};

export const WithProgramValidator: Story = {
    args: {
        pubkey: gen.publicKey(4),
        validator: programValidator,
    },
};
