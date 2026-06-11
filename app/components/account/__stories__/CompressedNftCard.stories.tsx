import type { Meta, StoryObj } from '@storybook/react';
import { withClusterAndAccounts } from '@storybook-config/decorators';

import type { CompressedNft } from '@/app/providers/compressed-nft';

import { CompressedNFTHeader } from '../CompressedNftCard';

function buildCompressedNft(
    overrides: Partial<{
        name: string;
        symbol: string;
        mutable: boolean;
    }> = {},
): CompressedNft {
    const { name = 'Compressed Ape #42', symbol = 'cAPE', mutable = true } = overrides;
    return {
        authorities: [],
        burnt: false,
        compression: {
            asset_hash: '',
            compressed: true,
            creator_hash: '',
            data_hash: '',
            eligible: true,
            leaf_id: 0,
            seq: 0,
            tree: '',
        },
        content: {
            $schema: '',
            files: [],
            // Empty json_uri → useMetadataJsonLink short-circuits to null; ArtContent renders the placeholder.
            json_uri: '',
            links: { external_url: '', image: '' },
            metadata: { attributes: [], description: '', name, symbol, token_standard: '' },
        },
        creators: [],
        grouping: [],
        id: 'CompressedNftaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        interface: '',
        mutable,
        ownership: { delegate: null, delegated: false, frozen: false, owner: '', ownership_model: 'single' },
        royalty: {
            basis_points: 0,
            locked: false,
            percent: 0,
            primary_sale_happened: false,
            royalty_model: '',
            target: null,
        },
        supply: { edition_nonce: null, print_current_supply: 0, print_max_supply: 0 },
    };
}

const meta: Meta<typeof CompressedNFTHeader> = {
    component: CompressedNFTHeader,
    decorators: [withClusterAndAccounts],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/CompressedNFTHeader',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { compressedNft: buildCompressedNft() },
};

export const Immutable: Story = {
    args: { compressedNft: buildCompressedNft({ mutable: false }) },
};

export const NoName: Story = {
    args: { compressedNft: buildCompressedNft({ name: '' }) },
};

export const NoSymbol: Story = {
    args: { compressedNft: buildCompressedNft({ symbol: '' }) },
};
