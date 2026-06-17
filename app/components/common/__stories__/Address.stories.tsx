import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { Address } from '../Address';

const pubkey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const meta: Meta<typeof Address> = {
    component: Address,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/Address',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { pubkey },
};

export const AsLink: Story = {
    args: { link: true, pubkey },
};

export const NotTruncated: Story = {
    args: { noTruncate: true, pubkey },
};

// useNickname is dead-coded in the Storybook bundle; overrideText simulates the visual.
export const WithNicknameSimulated: Story = {
    args: { overrideText: '"My Wallet" (Token Program)', pubkey },
};

export const WithOverrideText: Story = {
    args: { overrideText: 'Custom Label', pubkey },
};

export const AlignedRight: Story = {
    args: { alignRight: true, pubkey },
};
