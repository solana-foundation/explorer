import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { KitAddress } from '../KitAddress';

const meta: Meta<typeof KitAddress> = {
    component: KitAddress,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    // TODO: rename to 'Components/Common/KitAddress' once we move off Dashkit — keeping the legacy
    // title for now avoids churn in the Storybook tree mid-migration.
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
