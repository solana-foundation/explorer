import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { KitAddress } from '../KitAddress';

const meta: Meta<typeof KitAddress> = {
    component: KitAddress,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/KitAddress',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        address: address(PublicKey.default.toBase58()),
    },
};

export const AsLink: Story = {
    args: {
        address: address(PublicKey.default.toBase58()),
        link: true,
    },
};

export const NoTruncate: Story = {
    args: {
        address: address(PublicKey.default.toBase58()),
        noTruncate: true,
    },
};

export const AlignedRight: Story = {
    args: {
        address: address(PublicKey.default.toBase58()),
        alignRight: true,
    },
};
