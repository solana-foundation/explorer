import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

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

export const WithFallbackText: Story = {
    args: { fallbackText: 'Custom Label', pubkey: new PublicKey('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T') },
};

export const AlignedRight: Story = {
    args: { alignRight: true, pubkey },
};
