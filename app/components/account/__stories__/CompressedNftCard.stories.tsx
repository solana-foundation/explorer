import { compressedNft, FUNGIBLE_TOKEN } from '@components/account/__fixtures__/compressed-nft';
import { withClusterAndAccounts } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { CompressedNFTHeader } from '../CompressedNftCard';

const meta: Meta<typeof CompressedNFTHeader> = {
    component: CompressedNFTHeader,
    decorators: [withClusterAndAccounts],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/CompressedNFTHeader',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { compressedNft: compressedNft() },
};

export const Immutable: Story = {
    args: { compressedNft: compressedNft({ mutable: false }) },
};

export const NoName: Story = {
    args: { compressedNft: compressedNft({ name: '' }) },
};

export const NoSymbol: Story = {
    args: { compressedNft: compressedNft({ symbol: '' }) },
};

export const VerifiedCollection: Story = {
    args: { compressedNft: compressedNft({ collection: 'CoLLeCtionaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) },
};

export const UncompressedToken: Story = {
    args: { compressedNft: compressedNft(FUNGIBLE_TOKEN) },
};
