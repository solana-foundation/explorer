import { withClusterAndAccounts } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import type { CompressedNft } from '@/app/providers/compressed-nft';

import { CompressedNFTHeader } from '../CompressedNftCard';

const compressedNft = {
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
        json_uri: '',
        links: { external_url: '', image: '' },
        metadata: {
            attributes: [],
            description: '',
            name: 'Compressed Ape #42',
            symbol: 'cAPE',
            token_standard: '',
        },
    },
    creators: [],
    grouping: [],
    id: 'CompressedNftaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    interface: '',
    mutable: true,
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
} satisfies CompressedNft;

const meta: Meta<typeof CompressedNFTHeader> = {
    component: CompressedNFTHeader,
    decorators: [withClusterAndAccounts, withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/CompressedNFTHeader@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { compressedNft };

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
